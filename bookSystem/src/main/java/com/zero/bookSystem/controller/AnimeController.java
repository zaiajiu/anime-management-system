package com.zero.bookSystem.controller;

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

    /** 上传目录（来自 application.properties） */
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

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
                                     @RequestParam(defaultValue = "9") int size) {
        Integer userId = (Integer) request.getSession().getAttribute("userId");
        int offset=(page-1)*size;
        List<Animes> data = animeService.listAll(userId,offset,size);
        logger.info("传回前端数据数量："+data.size());
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
    public Result<List<Animes>> findByName(@RequestParam String animeName,HttpServletRequest request) {
        Integer userId = (Integer) request.getSession().getAttribute("userId");
        List<Animes> animeList = animeService.getByName(animeName,userId);
        if (animeList == null) {
            logger.warn("动漫不存在：名字={}", animeName);
            return Result.fail("动漫不存在");
        }
        logger.info("按名字获取动漫数量："+animeList.size());
        return Result.ok(animeList);
    }

    @GetMapping("/count")
    public Result<Integer> count(HttpServletRequest request) {
        Integer userId = (Integer) request.getSession().getAttribute("userId");
        return Result.ok(animeService.count(userId));
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
                imagePath = saveFile(image);
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
                String newPath = saveFile(image);
                anime.setImagePath(newPath);
                // 删旧图
                if (old.getImagePath() != null) {
                    deleteFile(old.getImagePath());
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

    // ============================================================
    // 删除：先删数据库，再删磁盘文件
    // ============================================================
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Integer id,
                               HttpServletRequest request) {
        Integer userId = (Integer) request.getSession().getAttribute("userId");
        Animes target = animeService.getById(id,userId);

        String err = animeService.delete(id);
        if (err != null) return Result.fail(err);

        // 数据库删成功后再删文件，避免"文件删了但数据库还在"
        if (target != null && target.getImagePath() != null) {
            deleteFile(target.getImagePath());
        }
        return Result.ok();
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

        logger.info("批量删除请求：ids={}, userId={}", ids, userId);

        // 3. 先查出所有需要删除的磁盘文件路径（只查属于自己的）
        List<String> imagePathsToDelete = new ArrayList<>();
        List<Animes> animesToDelete = new ArrayList<>();
        animesToDelete=animeService.getByIds(ids,userId);
        for (int i = 0; i < animesToDelete.size(); i++) {
            String path = animesToDelete.get(i).getImagePath();
            if (path != null) {
                imagePathsToDelete.add(path);
            }
        }

        // 4. 删数据库（Service 层会处理越权及部分失败的情况）
        String err = animeService.deleteBatch(ids, userId);
        if (err != null) {
            logger.warn("批量删除失败：ids={}, reason={}", ids, err);
            return Result.fail(err);
        }

        // 5. 删磁盘文件（只有数据库删成功了，才去删文件）
        for (int i = 0; i < imagePathsToDelete.size(); i++) {
            deleteFile(imagePathsToDelete.get(i));
        }

        logger.info("批量删除成功：ids={}", ids);
        return Result.ok();
    }

    // ============================================================
    // 保存文件：UUID 重命名，返回相对 URL
    // ============================================================
    private String saveFile(MultipartFile file) throws IOException {
        // 1. 提取扩展名
        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf(".")).toLowerCase();
        }

        // 2. UUID 命名，避免重名覆盖
        String filename = UUID.randomUUID().toString().replace("-", "") + ext;

        // 3. 解析并确保目录存在
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(dir);

        // 4. 写入磁盘
        Path target = dir.resolve(filename);
        file.transferTo(target.toFile());

        // 5. 返回相对路径（配合 WebMvcConfig）
        return "/uploads/" + filename;
    }

    // ============================================================
    // 删除磁盘文件
    // ============================================================
    private void deleteFile(String imagePath) {
        try {
            if (imagePath == null || !imagePath.startsWith("/uploads/")) return;

            String filename = imagePath.substring("/uploads/".length());
            Path target = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);

            Files.deleteIfExists(target);
            logger.info("磁盘图片删除成功，路径："+target);
        } catch (IOException e) {
            // 删文件失败不影响主流程
            System.err.println("删除图片失败：" + e.getMessage());
        }
    }
}