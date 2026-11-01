package com.zero.bookSystem.service;

import com.zero.bookSystem.controller.AnimeController;
import com.zero.bookSystem.dao.AnimeDao;
import com.zero.bookSystem.entity.Animes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.aot.AotServices;
import org.springframework.stereotype.Service;
import com.zero.bookSystem.utils.PinyinUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class AnimeService {
    private static final Logger logger = LoggerFactory.getLogger(AnimeController.class);
    public List<Animes> listAll(Integer userId,int offset,int size,String sortField,String sortOrder,Integer page) {
        if (!"name".equals(sortField)) {
            return AnimeDao.findAnimeAll(userId, offset, size, sortField, sortOrder);
        }
        List<Animes> allList = AnimeDao.findAllByName(userId);
        // 3. 使用 Java 的 Comparator 按拼音首字母排序
        Comparator<Animes> comparator = (a1, a2) -> {
            // 把中文名字转换成拼音首字母
            String pinyin1 = PinyinUtils.getFirstLetters(a1.getAnimeName());
            String pinyin2 = PinyinUtils.getFirstLetters(a2.getAnimeName());

            // 按照字母表 A-Z 比较
            int result = pinyin1.compareTo(pinyin2);

            // 如果是倒序 (Z-A)，就把结果取反
            if ("DESC".equalsIgnoreCase(sortOrder)) {
                return -result;
            }
            return result;
        };

        // 排序
        allList.sort(comparator);

        // 4. 内存分页：手动截取当前页的数据
        int fromIndex = (page - 1) * size;
        int toIndex = Math.min(fromIndex + size, allList.size());

        // 如果请求的页码超出了总数据量，返回空列表
        if (fromIndex >= allList.size()) {
            return new ArrayList<>();
        }

        // 截取对应区间返回
        return allList.subList(fromIndex, toIndex);

    }


    public int count(Integer userId) {
        return AnimeDao.count(userId);
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

    public List<Animes>  getByName(String animeName, Integer userId) {
        if (animeName == null || animeName.trim().isEmpty()) return null;
        return AnimeDao.findAnimesName(animeName.trim(),userId);
    }
    public String add(Animes anime) {
        if (anime.getAnimeName() == null || anime.getAnimeName().trim().isEmpty())
            return "动漫名称不能为空";
        if (anime.getUserId() == null)
            return "缺少用户信息";
        return AnimeDao.add(anime) ? null : "新增失败，请稍后重试";
    }

    public String update(Animes anime, Integer userId) {
        if (anime.getId() == null) return "缺少动漫 id";
        if (anime.getAnimeName() == null || anime.getAnimeName().trim().isEmpty())
            return "动漫名称不能为空";
        return AnimeDao.updateAnime(anime,userId) ? null : "修改失败，请稍后重试";
    }

    public String delete(Integer id) {
        if (id == null) return "缺少动漫 id";
        return AnimeDao.deleteAnime(id) ? null : "删除失败，请稍后重试";
    }

    /**
     * 批量删除
     * @return null 表示成功；非 null 是错误原因
     */
    public String deleteBatch(java.util.List<Integer> ids,Integer userId) {
        if (ids == null || ids.isEmpty()) {
            return "没有选择要删除的动漫";
        }
        int rows = AnimeDao.deleteAnimeBatch(ids,userId);
        if (rows > 0) {
            return null;
        }
        return "删除失败，可能这些动漫已被删除";
    }
}