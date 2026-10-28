package com.zero.bookSystem.dao;

import com.zero.bookSystem.DBCconfig.config;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 用户数据访问层（DAO）
 * 所有方法都是 static，供 Service 直接调用
 * 注意：这里保持你原有风格——密码明文存储/比对
 */
public class UserDao {

    Logger logger = LoggerFactory.getLogger(UserDao.class);

    /**
     * 校验密码强度
     * 规则：8-16 位，必须包含大写字母 + 小写字母 + 数字，且不能有空格
     * @return true 表示符合规则
     */
    public static boolean checkPassword(String password) {
        password = password.trim();
        if (password.contains(" ")) return false;
        return password.matches("^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,16}$");
    }

    /**
     * MD5 加密（保留，供以后需要时使用；当前 register/login 走明文）
     */
    public static String md5(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] bytes = md.digest(password.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
            return password;
        }
    }

    /**
     * 判断用户名是否已存在
     * @return true = 已存在
     */
    public static boolean existsUsername(String username) {
        // LIMIT 1：找到一条就够，提升性能
        String sql = "SELECT 1 FROM user WHERE username = ? LIMIT 1";
        try (Connection conn = config.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, username);
            ResultSet rs = pstmt.executeQuery();
            return rs.next();          // 有下一行 = 存在
        } catch (SQLException e) {
            System.out.println(e.getMessage());
            return false;
        }
    }

    /**
     * 查询用户信息（id、username、avatar、created_at）
     * @return Object[] {Integer id, String username, String avatar, Timestamp createdAt}
     *         查不到返回 null
     */
    public static Object[] getUserInfo(String username) {
        String sql = "SELECT id, username, avatar, created_at,nickname,signature FROM user WHERE username = ?";
        try (Connection conn = config.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, username);
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) {
                System.out.println("id:"+rs.getString("id")+" username:"+rs.getString("username")+" avatar:"+rs.getString("avatar"));
                return new Object[]{
                        rs.getInt("id"),
                        rs.getString("username"),
                        rs.getString("avatar"),
                        rs.getTimestamp("created_at"),
                        rs.getString("nickname"),
                        rs.getString("signature")
                };
            }
        } catch (SQLException e) {
            System.out.println(e.getMessage());
        }
        return null;
    }

    /**
     * 注册：插入一条用户记录
     * @return true = 插入成功
     */
    public static boolean register(String username, String password) {
        // 只插 username 和 password，其他字段用默认值
        // id 自增；avatar 为 NULL；created_at 数据库默认当前时间
        String sql = "INSERT INTO user(username, password) VALUES (?, ?)";
        try (Connection conn = config.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, username);
            pstmt.setString(2, password);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.out.println(e.getMessage());
            return false;
        }
    }

    /**
     * 登录：用户名 + 密码同时匹配才算成功
     * @return true = 登录成功
     */
    public static boolean login(String username, String password) {
        String sql = "SELECT * FROM user WHERE username = ? AND password = ?";
        try (Connection conn = config.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, username);
            pstmt.setString(2, password);
            ResultSet rs = pstmt.executeQuery();
            return rs.next();          // 查到 = 登录成功
        } catch (SQLException e) {
            System.out.println(e.getMessage());
            return false;
        }
    }

    public  static  boolean updateProfile(String nickName,String signature,String avatarPath,String userName) {
        System.out.println("UserDao 127:"+nickName+":/"+signature+":/"+avatarPath+":/"+userName);
        String sql = "UPDATE user SET nickName = ?, signature = ?, avatar = ? WHERE username = ?";
        try(Connection conn = config.getConnection();
            PreparedStatement pstmt = conn.prepareStatement(sql)){
            pstmt.setString(1, nickName);
            pstmt.setString(2, signature);
            pstmt.setString(3, avatarPath);
            pstmt.setString(4, userName);
            return pstmt.executeUpdate() > 0;
        }catch (SQLException e){
            System.out.println(e.getMessage());
            return false;
        }
    }
    /**
     * 修改密码
     * @return true = 更新成功（影响行数 > 0）
     */
    public static boolean updatePassword(String username, String newpassword) {
        String sql = "UPDATE user SET password = ? WHERE username = ?";
        try (Connection conn = config.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, newpassword);
            pstmt.setString(2, username);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.out.println(e.getMessage());
            return false;
        }
    }
}