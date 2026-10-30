package com.zero.bookSystem.dao;

import com.zero.bookSystem.DBCconfig.config;
import com.zero.bookSystem.entity.DailyNews;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class NewsDao {

    // 按日期查询早报
    public static DailyNews findByDate(String date) {
        String sql = "SELECT * FROM daily_news WHERE news_date = ?";
        try (Connection conn = config.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, date);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    DailyNews news = new DailyNews();
                    news.setId(rs.getInt("id"));
                    news.setNewsDate(rs.getString("news_date"));
                    news.setContent(rs.getString("content"));
                    return news;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // 插入早报
    public static boolean insert(DailyNews news) {
        String sql = "REPLACE INTO daily_news(news_date, content) VALUES (?, ?)";
        try (Connection conn = config.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, news.getNewsDate());
            pstmt.setString(2, news.getContent());
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}