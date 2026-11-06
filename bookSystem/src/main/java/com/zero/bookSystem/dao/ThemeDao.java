package com.zero.bookSystem.dao;

import com.zero.bookSystem.DBCconfig.config;
import com.zero.bookSystem.entity.UserTheme;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class ThemeDao {

    // 保存或更新主题（利用 user_id 的 UNIQUE 约束）
    public static boolean saveOrUpdate(UserTheme theme) {
        // REPLACE INTO 会先尝试插入，如果 user_id 已存在，则先删除旧数据再插入新数据
        String sql = "REPLACE INTO user_theme(user_id, background_image) VALUES (?, ?)";
        try (Connection conn = config.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, theme.getUserId());
            pstmt.setString(2, theme.getBackgroundImage());
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // 查询用户的主题
    public static UserTheme findByUserId(Integer userId) {
        String sql = "SELECT * FROM user_theme WHERE user_id = ?";
        try (Connection conn = config.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, userId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    UserTheme theme = new UserTheme();
                    theme.setId(rs.getInt("id"));
                    theme.setUserId(rs.getInt("user_id"));
                    theme.setBackgroundImage(rs.getString("background_image"));
                    return theme;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }
}