package com.zero.bookSystem.service;

import com.zero.bookSystem.dao.AdminDao;
import com.zero.bookSystem.dao.AnimeDao;
import com.zero.bookSystem.entity.Animes;
import com.zero.bookSystem.entity.User;
import com.zero.bookSystem.utils.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
@Service
public class AdminService {
    @Autowired
    private FileUtils fileUtils;
    @Autowired
    private AnimeService animeService;
    public List<Animes> findAllAnime(int offset,int size,String sortField,String sortOrder) {
        return AdminDao.findAllAnime(offset,size,sortField,sortOrder);
    }

    public List<User> findAllUser(int offset,int size,String sortField,String sortOrder) {
        return AdminDao.findAllUser(offset,size,sortField,sortOrder);
    }

    public String updatePassword(String username,String password) {
        if (username == null || password == null) {

            return "账号或密码不能为空";
        }
        if(AdminDao.updatePassword(username, password)){
            return null;
        }
        return "fail";
    }

    public List<Animes> getByIds(java.util.List<Integer> ids) {
        if (ids == null) return null;
        return  AdminDao.getAnimeIds(ids);
    }
    public String deleteBatch(java.util.List<Integer> ids) {
        // 3. 先查出所有需要删除的磁盘文件路径（只查属于自己的）
        List<String> imagePathsToDelete = new ArrayList<>();
        List<Animes> animesToDelete = new ArrayList<>();
        animesToDelete=this.getByIds(ids);
        for (int i = 0; i < animesToDelete.size(); i++) {
            String path = animesToDelete.get(i).getImagePath();
            if (path != null) {
                imagePathsToDelete.add(path);
            }
        }
        // 4. 删数据库
        int rows = AdminDao.deleteAnimeBatch(ids);
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
    public int countAnime() {
       int count = AdminDao.countAnime();
        return count;
    }
    public int countUser() {
        int count = AdminDao.countUser();
        return count;
    }
}
