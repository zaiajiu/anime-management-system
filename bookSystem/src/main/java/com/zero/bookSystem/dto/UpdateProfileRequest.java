package com.zero.bookSystem.dto;

public class UpdateProfileRequest {
    private String nickname;
    private String avatar;
    private String signature;
    // getter 和 setter...
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }
}