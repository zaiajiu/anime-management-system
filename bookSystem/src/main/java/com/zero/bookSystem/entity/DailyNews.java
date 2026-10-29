package com.zero.bookSystem.entity;

public class DailyNews {
    private Integer id;
    private String newsDate;
    private String content;

    // getter 和 setter
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getNewsDate() { return newsDate; }
    public void setNewsDate(String newsDate) { this.newsDate = newsDate; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}