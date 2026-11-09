package com.zero.bookSystem.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Component
public class FileUtils {
    /** 上传目录（来自 application.properties） */
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;
    // ============================================================
    // 保存文件：UUID 重命名，返回相对 URL
    // ============================================================
    public String saveFile(MultipartFile file) throws IOException {
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
    public void deleteFile(String imagePath) {
        try {
            if (imagePath == null || !imagePath.startsWith("/uploads/")) return;

            String filename = imagePath.substring("/uploads/".length());
            Path target = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);

            Files.deleteIfExists(target);
        } catch (IOException e) {
            // 删文件失败不影响主流程
            System.err.println("删除图片失败：" + e.getMessage());
        }
    }
}
