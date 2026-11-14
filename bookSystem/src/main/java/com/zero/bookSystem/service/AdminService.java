package com.zero.bookSystem.service;

import com.zero.bookSystem.dao.AdminDao;
import com.zero.bookSystem.entity.Animes;
import com.zero.bookSystem.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
@Service
public class AdminService {
    @Autowired
    private FileStorageService fileStorageService;
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
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
        String BCryptPassword = passwordEncoder.encode(password);
        if(AdminDao.updatePassword(username, BCryptPassword)){
            return null;
        }
        return "fail";
    }

    public List<Animes> getByIds(java.util.List<Integer> ids) {
        if (ids == null) return null;
        return  AdminDao.getAnimeIds(ids);
    }
    public String deleteBatch(java.util.List<Integer> ids) {
        List<String> imagePathsToDelete = new ArrayList<>();
        List<Animes> animesToDelete = new ArrayList<>();
        animesToDelete=this.getByIds(ids);
        for (int i = 0; i < animesToDelete.size(); i++) {
            String path = animesToDelete.get(i).getImagePath();
            if (path != null) {
                imagePathsToDelete.add(path);
            }
        }

        int rows = AdminDao.deleteAnimeBatch(ids);
        System.out.println(rows);
        if (rows <= 0) {
            return "数据库删除失败";
        }

        for (int i = 0; i < imagePathsToDelete.size(); i++) {
            try {
                fileStorageService.deleteFile(imagePathsToDelete.get(i));
            }catch (Exception e){
                System.out.println(e);
            }

        }

        if (ids == null || ids.isEmpty()) {
            return "没有选择要删除的动漫";
        }

        return null;
    }
    public int countAnime() {
       int count = AdminDao.countAnime();
        return count;
    }
    public int countUser() {
        int count = AdminDao.countUser();
        return count;
    }
    public String ban(int id) {
        String err =AdminDao.ban(id);
        if (err != null) {
            return err;
        }
        return "success";
    }
    public String unBan(int id) {
        String err =AdminDao.unBan(id);
        if (err != null) {
            return err;
        }
        return "success";
    }
}
