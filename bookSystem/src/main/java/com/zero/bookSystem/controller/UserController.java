package com.zero.bookSystem.controller;

import com.zero.bookSystem.common.Result;
import com.zero.bookSystem.dto.LoginRequest;
import com.zero.bookSystem.dto.RegisterRequest;
import com.zero.bookSystem.dto.UpdateProfileRequest;
import com.zero.bookSystem.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UserController {
    Logger logger = LoggerFactory.getLogger(UserController.class);
    @Autowired
    private UserService userService;

    /** 上传目录（来自 application.properties） */
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /** 注册 */
    @PostMapping("/register")
    public Result<Void> register(@RequestBody RegisterRequest req) {
        String err = userService.register(
                req.getUsername(), req.getPassword(), req.getConfirmPassword());
        return err == null ? Result.ok() : Result.fail(err);
    }

    /** 登录：★★★ 关键改动：登录成功把 userId 也写进 Session ★★★ */
    @PostMapping("/login")
    public Result<Map<String, Object>> login(
            @RequestBody LoginRequest req,
            HttpServletRequest request) {

        // 1. 校验用户名密码
        String err = userService.login(req.getUsername(), req.getPassword());
        if (err != null) return Result.fail(err);

        // 2. 查库拿 id（getUserInfo 返回 {id, username, avatar, createdAt}）
        Object[] info = userService.getUserInfo(req.getUsername());
        if (info == null) return Result.fail("用户不存在");
        Integer userId = (Integer) info[0];

        // 3. ★ 把 username 和 userId 都写进 Session
        request.getSession().setAttribute("username", req.getUsername());
        request.getSession().setAttribute("userId", userId);

        // 4. 顺便返回给前端，前端可以展示或存 localStorage（可选）
        Map<String, Object> data = new HashMap<>();
        data.put("userId", userId);
        data.put("username", req.getUsername());
        System.out.println("【登录】Session userId = " + userId);
        return Result.ok(data);
    }

    /** 退出 */
    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest request) {
        request.getSession().invalidate();
        return Result.ok();
    }

    /** 当前登录用户信息 */
    @GetMapping("/info")
    public Result<Map<String, Object>> info(HttpServletRequest request) {
        String username = (String) request.getSession().getAttribute("username");
        if (username == null) return Result.fail("未登录");

        Object[] info = userService.getUserInfo(username);
        logger.info("返回的更新数据"+Arrays.toString(info));
        if (info == null) return Result.fail("用户不存在");

        Map<String, Object> data = new HashMap<>();
        data.put("id", info[0]);
        data.put("username", info[1]);
        data.put("avatar", info[2]);
        data.put("createdAt", info[3]);
        data.put("nickname", info[4]);
        data.put("signature", info[5]);

        return Result.ok(data);
    }
//修改个人信息
@PostMapping("/updateProfile")
public Result<Void> updateProfile(
        @RequestParam("nickname") String nickname,
        @RequestParam(value = "signature", required = false) String signature,
        @RequestParam(value = "avatar", required = false) MultipartFile avatar,
        HttpServletRequest request
) {
    String userName = (String) request.getSession().getAttribute("username");
    if (userName == null) return Result.fail("未登录");

    String avatarPath = null;
    if (avatar == null) {
        Object[] info = userService.getUserInfo(userName);
        avatarPath = (String) info[2];
    }
    if (avatar != null && !avatar.isEmpty()) {
        try {
            // 复用你写好的 saveFile 逻辑（如果在 AnimeController 里，需要抽成公共工具类，或者在这里重新写一段保存逻辑）
            avatarPath = saveFile(avatar);
        } catch (IOException e) {
            e.printStackTrace();
            return Result.fail("头像上传失败");
        }
    }

    // 调用 Service 更新（如果 avatarPath 是 null，说明没传新图，DAO 里做一下判空，不要更新头像字段）
    String err = userService.updateProfile(nickname, signature, avatarPath, userName);
    return err == null ? Result.ok() : Result.fail(err);
}

    /** 修改密码 */
    @PostMapping("/updatePassword")
    public Result<Void> updatePassword(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        logger.info("username:"+body.get("username")+" oldPassword:"+body.get("oldPassword"));
        String username = (String) request.getSession().getAttribute("username");
        if (username == null) return Result.fail("未登录");

        String err = userService.updatePassword(
                username, body.get("oldPassword"), body.get("newPassword"));
        return err == null ? Result.ok() : Result.fail(err);
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

