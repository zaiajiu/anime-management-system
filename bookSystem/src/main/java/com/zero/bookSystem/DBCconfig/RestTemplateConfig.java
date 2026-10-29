package com.zero.bookSystem.DBCconfig;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate 配置类
 * 作用：把 RestTemplate 注册到 Spring 容器中，这样在其他地方就可以用 @Autowired 注入它了
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}