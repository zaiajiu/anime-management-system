# 动漫资源管理系统 (Anime Management System)

一个基于 React + Spring Boot 的前后端分离全栈项目。

## 🛠 技术栈
- **前端**：React 18, Vite, Tailwind CSS, shadcn/ui
- **后端**：Java 17, Spring Boot 3, 原生 JDBC, MySQL

## ✨ 核心功能
- 多用户数据隔离（基于 Session 拦截器防越权）
- 动漫信息展示、分页查询、模糊搜索
- 图片上传及本地磁盘托管映射（含服务器物理文件同步清理）
- 批量删除功能（支持动态 SQL 拼接与防 N+1 查询）
- 个人中心（资料修改、头像上传、密码修改）

## 🚀 本地启动指南
1. 导入 MySQL 数据库并修改 `application.properties` 中的数据库账号密码。
2. 启动后端 `BookSystemApplication.java`。
3. 进入 `ui` 目录，运行 `npm install`，然后 `npm run dev`。
