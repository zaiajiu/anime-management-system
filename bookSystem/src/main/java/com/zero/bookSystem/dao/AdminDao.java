package com.zero.bookSystem.dao;

import com.zero.bookSystem.config.DBCconfig;
import com.zero.bookSystem.entity.Animes;
import com.zero.bookSystem.entity.User;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class AdminDao {
    //查询所有动漫
    public static List<Animes> findAllAnime(int offset,int size,String sortField,String sortOrder) {
        List<Animes> animes = new ArrayList<>();
        String dbColumn = "id";
        if ("name".equals(sortField)){
            dbColumn ="pinyin_name";
        }
        else if("createTime".equals(sortOrder)){
            dbColumn = "create_time";
        }
        else if("updateTime".equals(sortField)){
            dbColumn = "update_time";
        }
        String order="DESE";
        if(sortOrder.equals("ASC")){
            order="ASC";
        }
        String sql = "SELECT * FROM anime ORDER BY"+dbColumn+" "+order+" LIMIT ?,?";
        try(Connection conn = DBCconfig.getConnection();
            PreparedStatement pstmt = conn.prepareStatement(sql)){
            pstmt .setInt(1, offset);
            pstmt.setInt(2, size);
            try(ResultSet rs = pstmt.executeQuery()){
                while(rs.next()){
                    Animes anime = new Animes();
                    anime.setId(rs.getInt("id"));
                    anime.setAnimeName(rs.getString("anime_name"));
                    anime.setAnimeIntroduction(rs.getString("anime_introduction"));
                    anime.setAnimeComment(rs.getString("anime_comment"));
                    anime.setImagePath(rs.getString("image_path"));
                    anime.setCreateTime(rs.getString("create_time"));
                    anime.setUpdateTime(rs.getString("update_time"));
                    animes.add(anime);
                }
            }

        }catch (Exception e){
            e.printStackTrace();
        }
        return animes;
    }
    //查询所有用户
    public static List<User> findAllUser(int offset,int size,String sortField,String sortOrder) {
        List<User> users = new ArrayList<>();
        String dbColumn = "id";
        if ("name".equals(sortField)){
            dbColumn ="username";
        }
        else if("createTime".equals(sortOrder)){
            dbColumn = "create_time";
        }
        else if("updateTime".equals(sortField)){
            dbColumn = "update_time";
        }
        String order="ASC";
        if(sortOrder.equals("ASC")){
            order="ASC";
        }
        String sql = "SELECT * FROM user WHERE "+dbColumn+" "+order+" LIMIT ?,?";
        try(Connection conn = DBCconfig.getConnection();
            PreparedStatement pstmt = conn.prepareStatement(sql)){
            pstmt.setInt(1, offset);
            pstmt.setInt(2, size);
            try(ResultSet rs = pstmt.executeQuery()){
                while(rs.next()){
                    User user = new User();
                    user.setId(rs.getInt("id"));
                    user.setUsername(rs.getString("username"));
                    user.setnickName(rs.getString("nickname"));
                    user.setavatar(rs.getString("avatar"));
                    user.setsignature(rs.getString("signature"));
                    user.setcreateTime(rs.getString("create_time"));
                    user.setupdateTime(rs.getString("update_time"));
                    users.add(user);
                }
            }

        }catch (Exception e){
            e.printStackTrace();
        }
        return users;
    }
    //重置密码
    public static boolean updatePassword(String username,String password){
        String sql = "UPDATE user SET password=? WHERE username=?";
        try(Connection conn = DBCconfig.getConnection();
            PreparedStatement pstmt = conn.prepareStatement(sql)){
            pstmt.setString(1, password);
            pstmt.setString(2, username);
            int rows = pstmt.executeUpdate();
            return rows > 0;
        }catch (Exception e){
            e.printStackTrace();
        }
        return false;
    }

    public  static List<Animes> getAnimeIds(java.util.List<Integer> ids)
    {

        List<Animes> AnimesListByIds=new ArrayList<Animes>();
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }
        // 动态拼占位符：?, ?, ?, ...
        StringBuilder placeholders = new StringBuilder();
        for (int i = 0; i < ids.size(); i++) {
            if (i > 0) {
                placeholders.append(", ");
            }
            placeholders.append("?");
        }
        String sql = "SELECT * FROM anime WHERE id IN (" + placeholders.toString() + ")";

        try (Connection conn = DBCconfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            for (int i = 0; i < ids.size(); i++) {
                pstmt.setInt(i + 2, ids.get(i));
            }
            try(ResultSet rs=pstmt.executeQuery();)
            {
                while(rs.next())
                {
                    Animes z=new Animes();
                    z.setId(rs.getInt("id"));
                    z.setImagePath(rs.getString("image_path"));
                    z.setAnimeName(rs.getString("anime_name"));
                    z.setUserId(rs.getInt("user_id"));
                    z.setAnimeIntroduction(rs.getString("anime_introduction"));
                    z.setAnimeComment(rs.getString("anime_comment"));
                    z.setCreateTime(rs.getString("create_time"));
                    z.setUpdateTime(rs.getString("update_time"));
                    AnimesListByIds.add(z);
                }
            }

        } catch (SQLException e) {
            return new ArrayList<>();
        }
        return AnimesListByIds;
    }
    public static int deleteAnimeBatch(java.util.List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }

        // 动态拼占位符：?, ?, ?, ...
        StringBuilder placeholders = new StringBuilder();
        for (int i = 0; i < ids.size(); i++) {
            if (i > 0) {
                placeholders.append(", ");
            }
            placeholders.append("?");
        }

        String sql = "DELETE FROM anime WHERE id IN (" + placeholders.toString() + ")";

        try (Connection conn = DBCconfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            for (int i = 0; i < ids.size(); i++) {
                pstmt.setInt(i + 2, ids.get(i));
            }

            int rows = pstmt.executeUpdate();
            return rows;

        } catch (SQLException e) {
            return 0;
        }
    }
    public  static int countAnime(){
        String sql = "SELECT count(*) FROM anime";
        try(Connection conn = DBCconfig.getConnection();
            PreparedStatement pstmt =conn.prepareStatement(sql)){
            try(ResultSet rs = pstmt.executeQuery()){
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }

        }catch (Exception e){
            e.printStackTrace();
        }
        return 0;
    }
    public  static int countUser(){
        String sql = "SELECT count(*) FROM user";
        try(Connection conn = DBCconfig.getConnection();
            PreparedStatement pstmt =conn.prepareStatement(sql)){
            try(ResultSet rs = pstmt.executeQuery()){
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }

        }catch (Exception e){
            e.printStackTrace();
        }
        return 0;
    }

    public static String ban(int id){
        String sql = "UPDATE user SET status=BANNED WHERE id=?";
        try(Connection conn = DBCconfig.getConnection();
            PreparedStatement pstmt = conn.prepareStatement(sql)){
            pstmt.setInt(1, id);
            int rows = pstmt.executeUpdate();
            if (rows > 0) {
                return null;
            }
        }catch (Exception e){
            e.printStackTrace();
        }
        return "error";
    }
    public static String unBan(int id){
        String sql = "UPDATE user SET status=NORMAL Where id=?";
        try(Connection conn =DBCconfig.getConnection();
        PreparedStatement pstmt = conn.prepareStatement(sql)){
            pstmt.setInt(1, id);
            if(pstmt.executeUpdate()>0){
                return null;
            }
        }catch (Exception e){
            e.printStackTrace();
        }
        return "error";
    }
}
