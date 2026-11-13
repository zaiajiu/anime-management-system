package com.zero.bookSystem.controller;

import com.zero.bookSystem.common.Result;
import com.zero.bookSystem.service.AnimeService;
import com.zero.bookSystem.service.FileStorageService;
import com.zero.bookSystem.service.ThemeService;
import com.zero.bookSystem.entity.UserTheme;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/theme")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ThemeController {
    @Autowired
    private ThemeService themeService;

    @Autowired
    private FileStorageService fileStorageService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    String subDirectory = "anime";

    @GetMapping("/info")
    public Result<UserTheme> getTheme(HttpServletRequest request) {
        Integer userId = (Integer) request.getSession().getAttribute("userId");
        if (userId == null) return Result.fail("未登录");

        UserTheme theme = themeService.getTheme(userId);
        return Result.ok(theme); // 如果没设置过，返回 data: null
    }

    @PostMapping("/upload")
    public Result<String> uploadBackground(
            @RequestParam("image") MultipartFile image,
            HttpServletRequest request) {
        Integer userId = (Integer) request.getSession().getAttribute("userId");
        if (userId == null) return Result.fail("未登录");

        try {
            String imagePath =fileStorageService.saveFile(image,subDirectory);

            return Result.ok(imagePath);
        } catch (IOException e) {
            return Result.fail("上传失败：" + e.getMessage());
        }
    }
}