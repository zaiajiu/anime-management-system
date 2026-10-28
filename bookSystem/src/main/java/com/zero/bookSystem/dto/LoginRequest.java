package com.zero.bookSystem.dto;

/**
 * 登录请求参数 DTO
 * 前端 POST /api/user/login 发的 JSON：
 * { "username": "xxx", "password": "xxx" }
 * Spring 会自动反序列化到这个对象
 */
public class LoginRequest {

    private String username;
    private String password;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}