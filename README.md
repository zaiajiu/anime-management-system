# 动漫资源管理系统 (Anime Management System)

前后端分离的动漫资源管理平台，包含用户端资源浏览与后台管理

## 🛠 技术栈
### 前端 (Frontend)
- **框架**: React 19 + Vite 8
- **样式**: Tailwind CSS 4 + shadcn/ui (Radix UI)
- **路由**: React Router v7
- **图标**: Lucide React

### 后端 (Backend)
- **核心框架**: Spring Boot 3.3.4
- **开发语言**: Java 21
- **数据库**: MySQL 8.x + 原生 JDBC 
- **安全机制**: Spring Security Crypto
- **其他工具**: pinyin4j 

## ✨ 核心功能
- 用户注册、登录、修改密码
- 动漫资源增删改查、多条件筛选、分页与排序
- 图片上传与清理
- 管理员后台：资源管理、用户管理
- 每日 AI 早报（大模型生成，定时落库）

## 设计与实现要点

**鉴权与越权防护**：登录后把 user_id 与角色写入 session，用 HandlerInterceptor 做全局校验；admin 前缀接口做角色判断；涉及数据的 SQL 统一附加 user_id 条件，业务层二次校验

**数据访问**：数据层不使用 ORM，全部手写 SQL 与结果集映射，便于观察每条语句的执行情况

**重复提交与文件清理**：使用 UUID 防重 token，提交后作废；删除资源时先删库再删文件，残留文件由定时任务扫盘清理。

**文件存储抽象**：上传与删除抽象为 FileStorageService 接口，本地实现类负责落盘，业务层只依赖接口

**第三方能力**：接入大模型 API 生成早报，@Scheduled 定时生成并覆盖写入

## 🚀 本地启动指南
### 1. 环境准备
- **JDK**: 21 或更高版本
- **Node.js**: 20 或更高版本 (推荐 22+)
- **MySQL**: 8.0 或更高版本
### 2. 数据库配置
1. 打开 MySQL 客户端，新建一个数据库（例如：`anime_system`）。
2. 导入项目根目录下的 `database.sql` 文件（如果无此文件，请手动执行建表语句）。
3. 修改后端配置文件：
   打开 `bookSystem/src/main/resources/application.properties`（或 `application-example.properties` 复制一份），填入你的本地数据库账号密码：
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/anime_system?useSSL=false&serverTimezone=Asia/Shanghai
   spring.datasource.username=root
   spring.datasource.password=你的数据库密码
### 3. 启动后端
使用 IDEA 打开 bookSystem 目录。
等待 Maven 依赖下载完成。
找到 src/main/java/com/zero/bookSystem/BookSystemApplication.java。
点击右上角绿色三角运行（或终端执行 mvn spring-boot:run）。
后端默认运行在 http://localhost:8080。
### 4.启动前端
打开终端
进入 Ui 目录
安装依赖
启动开发服务器

🔐 测试账号说明
普通用户：在前端注册页面直接注册即可体验。
管理员：由于系统不开放管理员注册，请前往数据库，将 user 表中某个用户的 role 字段修改为 ADMIN，重新登录后即可在侧边栏看到管理员专属入口。
