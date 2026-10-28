package com.zero.bookSystem.DBCconfig;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * 数据库连接工具类
 * 说明：这是手写 JDBC 的连接方式，项目里所有 DAO 都通过它拿 Connection
 * 后续如果想用 Spring 的连接池，可以换成 JdbcTemplate / MyBatis，这里先保持不变
 */
public class config {

    // 数据库地址：book_system 是库名，按你实际的改
    // useSSL=false 关闭 SSL；serverTimezone 指定时区；characterEncoding 指定编码
    private static final String URL =
            "jdbc:mysql://localhost:3306/anime_stystem" +
                    "?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8";

    // 数据库用户名
    private static final String USER = "root";

    // 数据库密码：⚠️ 改成你自己的
    private static final String PASSWORD = "123456";

    /**
     * 静态代码块：类加载时执行一次
     * 作用：注册 MySQL 驱动
     * 如果驱动没引入，会抛 ClassNotFoundException
     */
    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    /**
     * 获取数据库连接
     * @return Connection 对象
     * @throws SQLException 连接失败时抛出
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
}
