package com.zero.bookSystem.controller;

import com.zero.bookSystem.utils.FileUtils;
import com.zero.bookSystem.common.Result;
import com.zero.bookSystem.dto.BatchDeleteRequest;
import com.zero.bookSystem.entity.Animes;
import com.zero.bookSystem.service.AnimeService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/anime")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AnimeController {
    private static final Logger logger = LoggerFactory.getLogger(AnimeController.class);
    @Autowired
    private AnimeService animeService;
    @Autowired
    private FileUtils fileUtils;



    @GetMapping("/getSubmitToken")
    public Result<String> getSubmitToken(HttpServletRequest request) {
        // 生成一个 UUID
        String token = UUID.randomUUID().toString();
        // 存入 Session
        request.getSession().setAttribute("submit_token", token);
        return Result.ok(token);
    }

    // ============================================================
    // 列表 + 关键词搜索
    // ============================================================
    @GetMapping("/list")
    public Result<List<Animes>> list(HttpServletRequest request,
                                     @RequestParam(defaultValue = "1") int page,
                                     @RequestParam(defaultValue = "9") int size,
                                     @RequestParam(defaultValue = "id") String sortField,
                                     @RequestParam(defaultValue = "DESC") String sortOrder) {
        Integer userId = (Integer) request.getSession().getAttribute("userId");
        int offset=(page-1)*size;
        List<Animes> data = animeService.listAll(userId,offset,size,sortField,sortOrder);
        return Result.ok(data);
    }



    @GetMapping("/{id:[0-9]+}")
    public Result<Animes> getById(@PathVariable Integer id,HttpServletRequest request) {
        Integer userId = (Integer) request.getSession().getAttribute("userId");
        logger.info("查询单个动漫：id={}", id);

        Animes anime = animeService.getById(id,userId);
        if (anime == null) {
            logger.warn("动漫不存在：id={}", id);
            return Result.fail("动漫不存在");
        }
        return Result.ok(anime);
    }

    @GetMapping("/name")
    public Result<List<Animes>> findByName(@RequestParam String animeName,
                                           HttpServletRequest request,
                                           @RequestParam(defaultValue = "1") int page,
                                           @RequestParam(defaultValue = "9") int size,
                                           @RequestParam(defaultValue = "id") String sortField,
                                           @RequestParam(defaultValue = "DESC") String sortOrder) {
        Integer userId = (Integer) request.getSession().getAttribute("userId");
        int offset=(page-1)*size;
        List<Animes> animeList = animeService.getByName(animeName,userId,offset,size,sortField,sortOrder);
        if (animeList == null) {
            logger.warn("动漫不存在：名字={}", animeName);
            return Result.fail("动漫不存在");
        }
        logger.info("按名字获取动漫的数量："+animeList.size());
        return Result.ok(animeList);
    }

    @GetMapping("/count")
    public Result<Integer> count(HttpServletRequest request) {
        Integer userId = (Integer) request.getSession().getAttribute("userId");
        return Result.ok(animeService.count(userId));
    }
    @GetMapping("/name/count")
    public Result<Integer> countByName(@RequestParam String animeName, HttpServletRequest request) {
        Integer userId = (Integer) request.getSession().getAttribute("userId");
        int total = animeService.countByName(animeName, userId);
        return Result.ok(total);
    }

    // ============================================================
    // 新增：图片存磁盘，数据库只存相对路径
    // ============================================================
    @PostMapping
    public Result<Animes> add(
            @RequestParam("animeName") String animeName,
            @RequestParam(value = "animeIntroduction", required = false) String animeIntroduction,
            @RequestParam(value = "animeComment", required = false) String animeComment,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam("token") String token,
            HttpServletRequest request
    ) {
        // 1. 从 Session 获取之前存的 token
        String sessionToken = (String) request.getSession().getAttribute("submit_token");
        logger.info("token={}", sessionToken);
        // 2. 校验：前端传的 token 和 Session 里的不一致，或者 Session 里为空（说明已经被删了）
        if (sessionToken == null || !sessionToken.equals(token)) {
            return Result.fail("请勿重复提交！");
        }

        // 3. 核心：校验通过，立刻把 Session 里的 token 删掉！
        // 这样即使紧接着发来第二个请求，也会因为 token 为 null 而被拦截。
        request.getSession().removeAttribute("submit_token");
        // userId 从 Session 取
        Integer userId = (Integer) request.getSession().getAttribute("userId");
        if (userId == null) return Result.fail("未登录");

        try {
            // ① 保存文件并得到相对路径
            String imagePath = null;
            if (image != null && !image.isEmpty()) {
                imagePath = fileUtils.saveFile(image);
            }

            // ② 组装实体并入库
            Animes anime = new Animes();
            anime.setAnimeName(animeName.trim());
            anime.setAnimeIntroduction(animeIntroduction);
            anime.setAnimeComment(animeComment);
            anime.setImagePath(imagePath);   // 只存 /uploads/xxx.jpg
            anime.setUserId(userId);

            String err = animeService.add(anime);
            return err == null ? Result.ok(anime) : Result.fail(err);
        } catch (IOException e) {
            e.printStackTrace();
            return Result.fail("封面上传失败：" + e.getMessage());
        }
    }

    // ============================================================
    // 修改：只有传了新图才替换 image_path，否则保留原图
    // ============================================================
    @PutMapping("/{id}")
    public Result<Animes> update(
            @PathVariable Integer id,
            @RequestParam("animeName") String animeName,
            @RequestParam(value = "animeIntroduction", required = false) String animeIntroduction,
            @RequestParam(value = "animeComment", required = false) String animeComment,
            @RequestParam(value = "image", required = false) MultipartFile image,
            HttpServletRequest request
    ) {
        Integer userId = (Integer) request.getSession().getAttribute("userId");
        try {
            // 先查原记录
            Animes old = animeService.getById(id,userId);
            if (old == null) return Result.fail("动漫不存在");

            Animes anime = new Animes();
            anime.setId(id);
            anime.setAnimeName(animeName.trim());
            anime.setAnimeIntroduction(animeIntroduction);
            anime.setAnimeComment(animeComment);

            // 判断有没有传新图
            if (image != null && !image.isEmpty()) {
                // 存新图
                String newPath = fileUtils.saveFile(image);
                anime.setImagePath(newPath);
                // 删旧图
                if (old.getImagePath() != null) {
                    fileUtils.deleteFile(old.getImagePath());
                }
            } else {
                // ★ 保留原图：把原路径回填，否则 DAO 会写成 null
                anime.setImagePath(old.getImagePath());
            }

            String err = animeService.update(anime,userId);
            return err == null ? Result.ok(anime) : Result.fail(err);
        } catch (IOException e) {
            e.printStackTrace();
            return Result.fail("封面上传失败：" + e.getMessage());
        }
    }

    /**
     * 批量删除
     * 请求：POST /api/anime/batch-delete
     * 请求体：{ "ids": [1, 2, 3] }
     */
    @PostMapping("/batch-delete")
    public Result<Void> batchDelete(@RequestBody BatchDeleteRequest req,
                                    HttpServletRequest request) {

        // 1. 获取当前用户
        Integer userId = (Integer) request.getSession().getAttribute("userId");

        // 2. 获取要删除的 ID 列表（并判空，防止后面的死循环）
        List<Integer> ids = req.getIds();
        if (ids == null || ids.isEmpty()) {
            return Result.fail("没有选择要删除的动漫");
        }
        String err = animeService.deleteBatch(ids, userId);
        if (err != null) return Result.fail(err);

        return Result.ok();
    }

}