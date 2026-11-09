package com.zero.bookSystem.controller;


import com.zero.bookSystem.common.Result;
import com.zero.bookSystem.dto.BatchDeleteRequest;
import com.zero.bookSystem.entity.Animes;
import com.zero.bookSystem.entity.User;
import com.zero.bookSystem.service.AdminService;
import com.zero.bookSystem.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/admin")
public class AdminController{
    @Autowired
    AdminService adminService;
    @GetMapping("/allAnime")
    public Result<List<Animes>> findAllAnime(HttpServletRequest request,
                                             @RequestParam(defaultValue = "1") int page,
                                             @RequestParam(defaultValue = "9") int size,
                                             @RequestParam(defaultValue = "id") String sortField,
                                             @RequestParam(defaultValue = "DESC") String sortOrder) {
        String username = (String) request.getSession().getAttribute("username");
        if (username == null) return Result.fail("未登录");
        String role = (String) request.getSession().getAttribute("role");
        if (!role.equals("ADMIN")) {
            return Result.fail("没有权限！");
        }
        int offset=(page-1)*size;
        List<Animes> data = adminService.findAllAnime(page,size,sortField,sortOrder);
        return Result.ok(data);

    }
    @GetMapping("/allUser")
    public Result<List<User>> findAllUser(HttpServletRequest request,
                                          @RequestParam(defaultValue = "1") int page,
                                          @RequestParam(defaultValue = "9") int size,
                                          @RequestParam(defaultValue = "id") String sortField,
                                          @RequestParam(defaultValue = "DESC")  String sortOrder){
        String username = (String) request.getSession().getAttribute("username");
        if (username == null) return Result.fail("未登录");
        String role = (String) request.getSession().getAttribute("role");
        if (!role.equals("ADMIN")) {
            return Result.fail("没有权限！");
        }
        int offset=(page-1)*size;
        List<User> data = adminService.findAllUser(offset,size,sortField,sortOrder);
        return Result.ok(data);
    }
    @PutMapping("/updataPassword")
    public Result<Void> updataPassword(HttpServletRequest request,
                                       @RequestParam String userName,
                                        @RequestParam String newPassword) {
        String username = (String) request.getSession().getAttribute("username");
        if (username == null) return Result.fail("未登录");
        String role = (String) request.getSession().getAttribute("role");
        if (!role.equals("ADMIN")) {
            return Result.fail("没有权限！");
        }
        String err = adminService.updatePassword(username, newPassword);
        if (err != null) {
            return Result.fail(err);
        }
        return Result.ok();
    }
    @PostMapping("/batchDelete")
    public Result<Void> batchDelete(@RequestBody BatchDeleteRequest req,
                                    HttpServletRequest request) {

        // 1. 获取当前用户
        Integer userId = (Integer) request.getSession().getAttribute("userId");

        // 2. 获取要删除的 ID 列表（并判空，防止后面的死循环）
        List<Integer> ids = req.getIds();
        if (ids == null || ids.isEmpty()) {
            return Result.fail("没有选择要删除的动漫");
        }
        String err = adminService.deleteBatch(ids);
        if (err != null) return Result.fail(err);

        return Result.ok();
    }
}

