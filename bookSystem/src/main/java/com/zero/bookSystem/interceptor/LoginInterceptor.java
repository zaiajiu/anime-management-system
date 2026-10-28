package com.zero.bookSystem.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component//人spring管理这个类
public class LoginInterceptor implements HandlerInterceptor//implements HandlerInterceptor是系统接口，设置了前端请求到后端控制层前，请求执行完之前，请求结束三个时间点
{

    private static final Logger logger = LoggerFactory.getLogger(LoginInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        String uri = request.getRequestURI();
        String method = request.getMethod();

        logger.debug("拦截请求：{} {}", method, uri);

        // ★ 如果是 OPTIONS 预检请求，直接放行
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        // 白名单放行
        if (uri.startsWith("/api/user/login")
                || uri.startsWith("/api/user/register")
                || uri.startsWith("/api/user/logout")
                || uri.startsWith("/uploads/")
                || method.equals("OPTIONS")) {
            return true;
        }

        // 检查 Session
        Object userId = request.getSession().getAttribute("userId");
        if (userId == null) {
            logger.warn("未登录请求被拦截：{} {}", method, uri);
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"未登录\"}");
            return false;
        }

        logger.debug("已登录用户访问：userId={}", userId);
        return true;
    }
}
