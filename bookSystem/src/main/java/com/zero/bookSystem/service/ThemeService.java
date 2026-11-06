package com.zero.bookSystem.service;

import com.zero.bookSystem.dao.ThemeDao;
import com.zero.bookSystem.entity.UserTheme;
import org.springframework.stereotype.Service;

@Service
public class ThemeService {

    /**
     * 保存或更新主题背景
     * @return null 表示成功，非 null 表示错误原因
     */
    public String saveBackground(UserTheme t) {
        Integer userId=t.getUserId();
        String imagePath=t.getBackgroundImage();
        if (userId == null) {
            return "用户未登录";
        }
        if (imagePath == null || imagePath.isEmpty()) {
            return "背景图路径不能为空";
        }

        UserTheme theme = new UserTheme();
        theme.setUserId(userId);
        theme.setBackgroundImage(imagePath);

        boolean success = ThemeDao.saveOrUpdate(theme);
        return success ? null : "保存主题失败，请稍后重试";
    }

    /**
     * 获取用户主题
     */
    public UserTheme getTheme(Integer userId) {
        if (userId == null) return null;
        return ThemeDao.findByUserId(userId);
    }
}