package com.zero.bookSystem.service;

import com.zero.bookSystem.common.Result;
import com.zero.bookSystem.dao.UserDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.zero.bookSystem.Config.PasswordConfig;


@Service
public class UserService {
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
    Logger logger = LoggerFactory.getLogger(UserService.class);
    /**
     * 注册业务
     * 校验顺序：用户名非空 → 长度 → 密码非空 → 两次一致 → 密码强度 → 用户名唯一 → 密码加密 →入库
     */
    public String register(String username, String password, String confirmPassword) {
        // 1. 用户名非空
        if (username == null || username.trim().isEmpty()) return "用户名不能为空";

        // 2. 用户名长度限制（对应表里 username 字段长度）
        if (username.length() > 50) return "用户名过长（最多 50 个字符）";

        // 3. 密码非空
        if (password == null || confirmPassword == null) return "密码不能为空";

        // 4. 两次密码一致
        if (!password.equals(confirmPassword)) return "两次输入的密码不一致";

        // 5. 密码强度（复用 DAO 的规则）
        if (!UserDao.checkPassword(password))
            return "密码需 8-16 位，且包含大小写字母和数字";

        // 6. 用户名唯一
        if (UserDao.existsUsername(username)) return "用户名已存在";

        // 7. 密码加密
        String encodePassword = passwordEncoder.encode(password);


        return UserDao.register(username, encodePassword) ? null : "注册失败，请稍后重试";
    }

    /**
     * 登录业务
     * @return null 表示成功
     */
    public String login(String username, String password) {
        // 非空校验
        if (username == null || username.trim().isEmpty()
                || password == null || password.isEmpty()) {
            return "用户名或密码不能为空";
        }
        String dbPassword = UserDao.login(username);
        System.out.println("USerService61: "+dbPassword);

        // 数据库比对
        boolean err =passwordEncoder.matches(password,dbPassword);
        System.out.println("登录检测"+err);
        if (err){
            return null;
        }
        return "密码错误";
    }

    public String updateProfile(String nickName, String signature, String avatarPath, String userName) {
        if (userName == null || userName.trim().isEmpty()){
            return "userName is null";
        }
        if (avatarPath == null || avatarPath.trim().isEmpty()){
            avatarPath = "null";
        }
        if (nickName == null || nickName.trim().isEmpty()){
            nickName = "null";
        }
        Boolean err =UserDao.updateProfile(nickName,signature,avatarPath,userName);
        if (err==false){
            return "业务层修改个人信息出错";
        }
        return null;
    }

    /**
     * 修改密码业务
     * 流程：先验证原密码 → 校验新密码强度 → 更新
     */
    public String updatePassword(String username, String oldPassword, String newPassword) {
        // 1. 原密码正确性（复用 login 校验）

        if (this.login(username, oldPassword)!=null) return "原密码错误";

        // 2. 新密码强度
        if (!UserDao.checkPassword(newPassword))
            return "新密码需 8-16 位，且包含大小写字母和数字";

        // 3. 更新
        String encodePassword = passwordEncoder.encode(newPassword);
        return UserDao.updatePassword(username, encodePassword) ? null : "修改失败，请稍后重试";
    }

    /**
     * 查询用户信息，直接委托给 DAO
     */
    public Object[] getUserInfo(String username) {
        return UserDao.getUserInfo(username);
    }
}