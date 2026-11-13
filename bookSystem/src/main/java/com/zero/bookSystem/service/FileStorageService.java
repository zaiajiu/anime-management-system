package com.zero.bookSystem.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface FileStorageService {
    String saveFile(MultipartFile file,String subDirectory) throws IOException;
    void deleteFile(String filePath) throws IOException;
}
