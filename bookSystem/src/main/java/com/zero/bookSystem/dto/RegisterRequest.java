package com.zero.bookSystem.dto;

/**
 * 注册请求参数 DTO
 * 前端 POST /api/user/register 发的 JSON：
 * { "username": "xxx", "password": "xxx", "confirmPassword": "xxx" }
 */
public class RegisterRequest {

    private String username;
    private String password;

    /** 确认密码：前后端都要校验两次一致 */
    private String confirmPassword;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
}