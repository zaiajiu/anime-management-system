package com.zero.bookSystem.dao;

import com.zero.bookSystem.Config.DBCconfig;
import com.zero.bookSystem.entity.Animes;
import com.zero.bookSystem.entity.User;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

public class AdminDao {
    public List<Animes> findAllAnime(int offset,int size,String sortField,String sortOrder) {
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

    public List<User> findAllUser(int offset,int size,String sortField,String sortOrder) {
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
}
