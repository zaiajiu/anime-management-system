package com.zero.bookSystem.service.impl;


import com.zero.bookSystem.service.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class LocalFileStorageServiceImpl implements FileStorageService {
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public String saveFile(MultipartFile file,String subDirectory) throws IOException {
        // 1. 提取扩展名
        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf(".")).toLowerCase();
        }

        // 2. UUID 命名，避免重名覆盖
        String filename = UUID.randomUUID().toString().replace("-", "") + ext;

        // 3. 解析并确保目录存在
        Path dir = Paths.get(uploadDir,subDirectory).toAbsolutePath().normalize();
        Files.createDirectories(dir);

        // 4. 写入磁盘
        System.out.println("写入磁盘"+dir.toString());
        Path target = dir.resolve(filename);
        file.transferTo(target.toFile());

        // 5. 返回相对路径
        return "/uploads/" +subDirectory + "/" + filename;
    }
    @Override
    public void deleteFile(String filePath) throws IOException {
//        try {
//            if (imagePath == null || !imagePath.startsWith("/uploads/")) return;
//
//            String filename = imagePath.substring("/uploads/".length());
//            Path target = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
//
//            Files.deleteIfExists(target);
//        } catch (IOException e) {
//            // 删文件失败不影响主流程
//            System.err.println("删除图片失败：" + e.getMessage());
//        }
//    }
        System.out.println("删除磁盘："+filePath);
        if (filePath == null || !filePath.startsWith("/uploads/")) {
            return;
        }
        try {
            String relativePath = filePath.substring("/uploads/".length());
            Path target = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(relativePath);
            Files.deleteIfExists(target);
            System.out.println("本地文件删除成功："+target);
        } catch (IOException e) {
            System.out.println("本地文件删除失败："+filePath + e);
        }
    }
}
