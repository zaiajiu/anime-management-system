package com.zero.bookSystem.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class RedisUtils {
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private RedisTemplate<String,Object> redisTemplate;

    public boolean expire(String key, long time){
        try{
            if(time>0){
                redisTemplate.expire(key,time, TimeUnit.SECONDS);
            }

        }catch (Exception e){
            e.printStackTrace();
            return false;
        }
        return false;
    }
    public <T> T get(String key, TypeReference<T> ref)  {
        if (key == null) {
            return null;
        }
        Object v = redisTemplate.opsForValue().get(key);
        return objectMapper.convertValue(v, ref);
    }
    public boolean set(String key,Object value){
        try{
            if(value==null){
                redisTemplate.opsForValue().set(key,"NULL");
                return true;
            }
            redisTemplate.opsForValue().set(key,value);
            return true;
        }catch (Exception e){
            e.printStackTrace();
            return false;
        }
    }
    public boolean set(String key,Object value,long time){
        try{
            if(value==null){
                redisTemplate.opsForValue().set(key,"NULL",time,TimeUnit.SECONDS);
                return true;
            }
            else{
                redisTemplate.opsForValue().set(key,value,time,TimeUnit.SECONDS);
                return true;
            }
        }catch (Exception e){
            e.printStackTrace();
            return false;
        }
    }
    public boolean del(String key){
        try{
            if (key != null) {

                return Boolean.TRUE.equals(redisTemplate.delete(key));
            }
        }catch (Exception e){
            e.printStackTrace();
            return false;
        }
        return false;
    }
    public boolean has(String key){
        try{
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        }catch (Exception e){
            e.printStackTrace();
            return false;
        }
    }
}
