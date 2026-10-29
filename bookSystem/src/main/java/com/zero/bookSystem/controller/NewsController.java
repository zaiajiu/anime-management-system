package com.zero.bookSystem.controller;

import com.zero.bookSystem.common.Result;
import com.zero.bookSystem.entity.DailyNews;
import com.zero.bookSystem.service.NewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/news")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class NewsController {

    @Autowired
    private NewsService newsService;

    @GetMapping("/Newspaper")
    public Result<Map<String, Object>> getNewspaperNews() {
        DailyNews news = newsService.getTodayNews();

        if (news == null) {
            return Result.fail("报文生成失败，请稍后重试");
        }

        // 组装前端需要的数据格式
        Map<String, Object> data = new HashMap<>();
        data.put("date", news.getNewsDate());
        data.put("text", news.getContent());

        return Result.ok(data);
    }
}