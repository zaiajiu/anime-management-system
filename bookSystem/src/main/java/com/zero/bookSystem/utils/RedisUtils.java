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
                redisTemplate.expire(key,time, TimeUnit.SECONDS);
            }

        }catch (Exception e){
            e.printStackTrace();
            return false;
        }
        return false;
    }
    public Object get(String key) {
        return key == null ? null : redisTemplate.opsForValue().get(key);
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
