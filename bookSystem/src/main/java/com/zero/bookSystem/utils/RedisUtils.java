package com.zero.bookSystem.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class RedisUtils {
    @Autowired
    private RedisTemplate<String,Object> redisTemplate;

    public boolean expire(String key, long time){
        try{
            if(time>0){
                redisTemplate.expire(key,time, TimeUnit.SECONDS)
            }

        }catch (Exception e){
            e.printStackTrace();
            return false;
        }
    }
}
