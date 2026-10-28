package com.zero.bookSystem.entity;

public class User {
    private Integer id;
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id=id;
    }
    //账号
    private String username;
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username=username;
    }
    //密码
    private String password;
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password=password;
    }
    //头像路径，提供现成的默认头像，用于注册时选择
    private String avatar;
    public String getavatar() {
        return avatar;
    }
    public void setavatar(String avatar) {
        this.avatar=avatar;
    }

    private String signature;
    public String getsignature() {
        return signature;
    }
    public void setsignature(String signature) {this.signature=signature;}

    private String nickName;
    public String getnickName() {
        return nickName;
    }
    public void setnickName(String nickName) {this.nickName=nickName;}


    public void user(){}
    public void user(Integer id,String account,String password,String avatar){
        this.id=id;
        this.username=username;
        this.password=password;
        this.avatar=avatar;
        this.signature=signature;
        this.nickName=nickName;
    }
}
