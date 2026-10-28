package com.zero.bookSystem.entity;

import java.math.BigDecimal;
//一，
//Anime类为此书影系统的动漫板块的实体类，分别包含了
//动漫的创建时间createTime
//动漫的最近修改时间updataTime
//存储动漫的身份码id
//动漫封面的路劲imagePath
//动漫的名称animeName
//对动漫的介绍animeIntrodu
//用户对动漫的观后感animeComment
//userId:为了在多个用户同时调用数据库时不错乱，后续前端的任何操作都需要此id
//二，
//以上是初步的基本属性，未来可能还需优化
//1.将“修改时间”修改为容器，记录用户所有的修改时间
//2.对用户修改前的内容进行备份
//3，追加动漫详情页内的动漫剧照，或是用户自己喜欢的图片壁纸
//4.详情页更加细化，将简介内容分为作品发布时间，主要角色，声优，导演，原作以衍生作。。。
//6.追加页面布局模板自定义功能
//7.追加用户创作模块，用于保存用户的同人创作等
//后续如有追加内容务必记住“不得干涉用户的记录，若有公告，广告等不得出现在主要页面，更不许出现在记录作品的页面”
public class Animes {
    private String createTime;
    public  String getCreateTime() {return createTime;}
    public void setCreateTime(String createTime){this.createTime=createTime;}

    private String updateTime;
    public  String getUpdateTime() {return updateTime;}
    public void setUpdateTime(String updateTime){this.updateTime=updateTime;}

    private Integer id;
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    //图片路径
    private String imagePath;
    public String getImagePath() {
        return imagePath;
    }
    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }
    //动漫名称
    private String animeName;
    public String getAnimeName() {
        return animeName;
    }
    public void setAnimeName(String animeName) {
        this.animeName = animeName;
    }
//动漫的简介属性
    private String animeIntroduction;
    public String getAnimeIntroduction() {
        return animeIntroduction;
    }
    public void setAnimeIntroduction(String animeIntroduction) {
        this.animeIntroduction = animeIntroduction;
    }
//动漫的读后感
    private String animeComment;
    public String getAnimeComment() {
        return animeComment;
    }
    public void setAnimeComment(String animeComment) {
        this.animeComment = animeComment;
    }
//用于数据库区分不同用户，后续前端传值必须带上，否则无效
    private Integer userId;
    public Integer getUserId() {
        return userId;
    }
    public void setUserId(Integer userId) {
        this.userId = userId;
    }

//有参构造
    public void Animes(){}
    public void Animes(Integer id,String imagePath, String animeName, String animeIntroduction, String animeComment,Integer userId) {
        this.id = id;
        this.imagePath = imagePath;
        this.animeName = animeName;
        this.animeIntroduction = animeIntroduction;
        this.animeComment = animeComment;
        this.userId = userId;
    }
    //注解，用于控制台输出可供观看的内容
    @Override
    public String toString()
    {
        return "Anime{"
                + "/id="+id
                +"/imagePath="+imagePath
                +"/animeName="+animeName
                +"/animeIntroduction="+animeIntroduction
                +"/animeComment="+animeComment
                +"/userId="+userId
                +"/create_time="+createTime
                +"/update_time="+updateTime
                +"}";
    }
}
