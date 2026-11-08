package com.zero.bookSystem.controller;


import com.zero.bookSystem.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/admin")
public class AdminController{
    @Autowired
    UserService adminService;
}

