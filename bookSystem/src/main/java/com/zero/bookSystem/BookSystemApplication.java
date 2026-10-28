package com.zero.bookSystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot 启动类
 * @SpringBootApplication = @Configuration + @EnableAutoConfiguration + @ComponentScan
 * 它会自动扫描当前包及子包下的所有 @Component / @Service / @Controller / @Repository
 */
@SpringBootApplication
public class BookSystemApplication {
	public static void main(String[] args) {
		SpringApplication.run(BookSystemApplication.class, args);
	}
}