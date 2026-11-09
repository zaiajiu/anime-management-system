package com.zero.bookSystem.service;

import com.zero.bookSystem.common.Result;
import com.zero.bookSystem.controller.AnimeController;
import com.zero.bookSystem.dao.AnimeDao;
import com.zero.bookSystem.entity.Animes;
import com.zero.bookSystem.utils.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.aot.AotServices;
import org.springframework.stereotype.Service;
import com.zero.bookSystem.utils.PinyinUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class AnimeService {
    @Autowired
    private FileUtils fileUtils;
    private static final Logger logger = LoggerFactory.getLogger(AnimeController.class);
    public List<Animes> listAll(Integer userId,int offset,int size,String sortField,String sortOrder) {
        return AnimeDao.findAnimeAll(userId,offset,size,sortField,sortOrder);
    }


    public int count(Integer userId) {
        return AnimeDao.count(userId);
    }
    public int countByName(String animeName,Integer userId) {
        return AnimeDao.countByName(animeName,userId);
    }

    /** ★ 按 id 查单条（更新时用） */
    public Animes getById(Integer id, Integer userId) {
        if (id == null) return null;
        if (userId == null) return null;
        return AnimeDao.findAnimesId(id,userId);
    }
    //
    public List<Animes> getByIds(java.util.List<Integer> ids,Integer userId) {
        if (ids == null) return null;
        if (userId == null) return null;
        return  AnimeDao.findAnimeIds(ids,userId);
    }

    public List<Animes>  getByName(String animeName, Integer userId,Integer offset,Integer size,String sortField,String sortOrder) {
        if (animeName == null || animeName.trim().isEmpty()) return null;
        return AnimeDao.findAnimesName(animeName.trim(),userId,offset,size,sortField,sortOrder);
    }
    public String add(Animes anime) {
        if (anime.getAnimeName() == null || anime.getAnimeName().trim().isEmpty())
            return "动漫名称不能为空";
        if (anime.getUserId() == null)
            return "缺少用户信息";

        // 自动把中文转成拼音首字母并塞进去
        if (anime.getAnimeName() != null) {
            String pinyin = PinyinUtils.getFirstLetters(anime.getAnimeName());
            anime.setPinyinName(pinyin);
        }
        return AnimeDao.add(anime) ? null : "新增失败，请稍后重试";

    }

    public String update(Animes anime, Integer userId) {
        if (anime.getId() == null) return "缺少动漫 id";
        if (anime.getAnimeName() == null || anime.getAnimeName().trim().isEmpty())
            return "动漫名称不能为空";
        if (anime.getAnimeName() != null) {
            String pinyin = PinyinUtils.getFirstLetters(anime.getAnimeName());
            anime.setPinyinName(pinyin);
        }
        return AnimeDao.updateAnime(anime,userId) ? null : "修改失败，请稍后重试";
    }


    /**
     * 批量删除
     * @return null 表示成功；非 null 是错误原因
     */
    public String deleteBatch(java.util.List<Integer> ids,Integer userId) {
        // 3. 先查出所有需要删除的磁盘文件路径（只查属于自己的）
        List<String> imagePathsToDelete = new ArrayList<>();
        List<Animes> animesToDelete = new ArrayList<>();
        animesToDelete=this.getByIds(ids,userId);
        for (int i = 0; i < animesToDelete.size(); i++) {
            String path = animesToDelete.get(i).getImagePath();
            if (path != null) {
                imagePathsToDelete.add(path);
            }
        }
        // 4. 删数据库
        int rows = AnimeDao.deleteAnimeBatch(ids, userId);
        if (rows > 0) {
            return null;
        }

        // 5. 删磁盘文件（只有数据库删成功了，才去删文件）
        for (int i = 0; i < imagePathsToDelete.size(); i++) {
            fileUtils.deleteFile(imagePathsToDelete.get(i));
        }

        if (ids == null || ids.isEmpty()) {
            return "没有选择要删除的动漫";
        }

        return "删除失败，可能这些动漫已被删除";
    }

}