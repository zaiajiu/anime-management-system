package com.zero.bookSystem.dto;

public class AnimeQueryRequest {
    private Integer page = 1;
    private Integer size = 9;
    private String sortField = "id";    // 默认按 id 排序
    private String sortOrder = "DESC";  // 默认倒序

    public Integer getPage() { return page; }
    public void setPage(Integer page) { this.page = page; }
    public Integer getSize() { return size; }
    public void setSize(Integer size) { this.size = size; }
    public String getSortField() { return sortField; }
    public void setSortField(String sortField) { this.sortField = sortField; }
    public String getSortOrder() { return sortOrder; }
    public void setSortOrder(String sortOrder) { this.sortOrder = sortOrder; }
}