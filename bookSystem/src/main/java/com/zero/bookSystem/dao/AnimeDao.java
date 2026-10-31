package com.zero.bookSystem.dao;

import com.zero.bookSystem.common.Result;
import com.zero.bookSystem.entity.Animes;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import com.zero.bookSystem.DBCconfig.config;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Repository
    public class AnimeDao {


    private static final Logger logger = LoggerFactory.getLogger(AnimeDao.class);
        //添加动漫，id，createTime，updataTime数据库会自动生成,后续传值只需要按传剩下五个
        public static boolean add(Animes z)//以Animes类为蓝本，创建一个z对象用于接收调用此
        {
            String sql = "INSERT INTO anime(image_path, anime_name, anime_introduction, anime_comment, user_id) VALUES (?, ?, ?, ?, ?)";
            try(Connection conn = config.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);)
            {
                System.out.println(z);
                pstmt.setString(1, z.getImagePath());
                pstmt.setString(2, z.getAnimeName());
                pstmt.setString(3, z.getAnimeIntroduction());
                pstmt.setString(4, z.getAnimeComment());
                pstmt.setInt(5, z.getUserId());
                int rows = pstmt.executeUpdate();
                return rows > 0;
            } catch (SQLException e) {
                System.out.println("动漫添加失败！"+e.getMessage());
                e.printStackTrace();
                return false;
            }
        }


        //计数，返回的是anime表里的数据数量
        public static int count(Integer userId)
        {
            String sql = "SELECT COUNT(*) FROM anime WHERE user_id=?";
            try(Connection conn = config.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);){
                pstmt.setInt(1, userId);
                try(ResultSet rs=pstmt.executeQuery();) {

                    if (rs.next()) {
                        return rs.getInt(1);
                    }
                }
            }catch (SQLException e){
                e.printStackTrace();
            }
            return 0;
        }
        //size代表每页数据数量
        //sort代表查询结果按什么方式排序，例如按id排序，按名字排序等
        //order代表排序是顺序还是倒序
        public  static List<Animes> findAnimeAll(Integer userId,int offset,int size, String sortField, String sortOrder)
        {
            List<Animes> AnimesListAll=new ArrayList<Animes>();
            // ★ 1. 白名单校验：把前端传的字段映射到数据库真实字段
            String dbColumn = "id"; // 默认
            if ("name".equals(sortField)) {
                dbColumn = "anime_name";
            } else if ("createTime".equals(sortField)) {
                dbColumn = "create_time";
            } else if ("updateTime".equals(sortField)) {
                dbColumn = "update_time";
            }
            // ★ 2. 校验排序方向
            String order = "DESC";
            if ("ASC".equalsIgnoreCase(sortOrder)) {
                order = "ASC";
            }
            String sql="SELECT * FROM anime WHERE user_id = ? ORDER BY "+dbColumn+" "+order+" LIMIT ?, ?";
            try(Connection conn = config.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);
                )
            {
                pstmt.setInt(1, userId);
                pstmt.setInt(2, offset);
                pstmt.setInt(3, size);

                try(ResultSet rs=pstmt.executeQuery()) {
                    while (rs.next()) {
                        Animes z = new Animes();
                        z.setId(rs.getInt("id"));
                        z.setImagePath(rs.getString("image_path"));
                        z.setAnimeName(rs.getString("anime_name"));
                        z.setUserId(rs.getInt("user_id"));
                        z.setAnimeIntroduction(rs.getString("anime_introduction"));
                        z.setAnimeComment(rs.getString("anime_comment"));
                        z.setCreateTime(rs.getString("create_time"));
                        z.setUpdateTime(rs.getString("update_time"));
                        AnimesListAll.add(z);
                    }
                }
            }catch (SQLException e) {
                System.out.println("查询失败！" + e.getMessage());
                e.printStackTrace();
            }
            logger.info("数据库查询全部动漫共"+AnimesListAll.size()+"条");
            System.out.println(AnimesListAll);
            return AnimesListAll;
        }

        //按名字
        public static List<Animes>  findAnimesName(String animeName,Integer userId)
        {
            List<Animes> AnimesList=new ArrayList<>();

//        String sql="SELECT * FROM goods WHERE name LIKE ? LIMIT "+offset+","+size;
            String sql = "SELECT * FROM anime WHERE anime_name LIKE ? AND user_id = ? ORDER BY id DESC ";
            try(Connection conn = config.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);)
            {
                pstmt.setString(1, "%"+animeName+"%");
                pstmt.setInt(2, userId);
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
                        AnimesList.add(z);
                    }
                }
            }catch (SQLException e) {
                System.out.println("查询失败！" + e.getMessage());
                e.printStackTrace();
            }
            logger.info("按名字获取动漫数量："+AnimesList.size());
            return AnimesList;
        }

    //按id查询，用于修改
    public static Animes findAnimesId(Integer id,Integer userId)
    {
        Animes animes=new Animes();

        String sql = "SELECT * FROM anime WHERE id LIKE ? AND user_id = ?";
        try(Connection conn = config.getConnection();
            PreparedStatement pstmt = conn.prepareStatement(sql);)
        {
            pstmt.setInt(1, id);
            pstmt.setInt(2, userId);
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
                    animes=z;
                }
            }
        }catch (SQLException e) {
            System.out.println("查询失败！" + e.getMessage());
            e.printStackTrace();
        }
        return animes;
    }
    //批量按id查询，用于删除获取id删盘
    public  static List<Animes> findAnimeIds(java.util.List<Integer> ids,Integer userId)
    {

        List<Animes> AnimesListByIds=new ArrayList<Animes>();
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }
        if (userId == null) {
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
        String sql = "SELECT * FROM anime WHERE user_id = ? AND id IN (" + placeholders.toString() + ")";

        try (Connection conn = config.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, userId);
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
            logger.error("查询动漫失败：ids={}", ids, e);
            return new ArrayList<>();
        }
        return AnimesListByIds;
    }

    public  static boolean updateAnime(Animes animes,Integer userId)
        {
            String sql = "UPDATE anime "
                    + "SET anime_name=?, image_path=?, anime_introduction=?, anime_comment=? "
                    + "WHERE id=? AND user_id=?";
            try(Connection conn = config.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);
            )
            {
                pstmt.setString(1, animes.getAnimeName());
                pstmt.setString(2,animes.getImagePath());
                pstmt.setString(3,animes.getAnimeIntroduction());
                pstmt.setString(4,animes.getAnimeComment());
                pstmt.setInt(5,animes.getId());
                pstmt.setInt(6,userId);
                int rows = pstmt.executeUpdate();
                return rows > 0;
            }catch (SQLException e) {

                System.out.println("动漫修改失败！"+e.getMessage());
                e.printStackTrace();
                return false;
            }
        }

        //删除单个动漫
        public  static boolean deleteAnime(Integer id)
        {
            String sql = "DELETE FROM anime WHERE id=?";
            try(Connection conn = config.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);
            )
            {
                pstmt.setInt(1,id);
                int rows = pstmt.executeUpdate();
                return rows > 0;
            }catch (SQLException e) {
                System.out.println("动漫删除失败！"+e.getMessage());
                e.printStackTrace();
                return false;
            }
        }

    /**
     * 批量删除动漫
     * 用 IN 一次删多条
     * @param ids 要删除的 id 列表
     * @return 实际删除的行数
     */
    public static int deleteAnimeBatch(java.util.List<Integer> ids,Integer userId) {
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

        String sql = "DELETE FROM anime WHERE user_id = ? AND id IN (" + placeholders.toString() + ")";

        try (Connection conn = config.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, userId);
            for (int i = 0; i < ids.size(); i++) {
                pstmt.setInt(i + 2, ids.get(i));
            }

            int rows = pstmt.executeUpdate();
            logger.info("批量删除动漫：ids={}, affectedRows={}", ids, rows);
            return rows;

        } catch (SQLException e) {
            logger.error("批量删除动漫失败：ids={}", ids, e);
            return 0;
        }
    }

    }

