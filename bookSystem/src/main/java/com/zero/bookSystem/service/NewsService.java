package com.zero.bookSystem.service;

import com.zero.bookSystem.dao.NewsDao;
import com.zero.bookSystem.entity.DailyNews;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NewsService {

    private static final Logger logger = LoggerFactory.getLogger(NewsService.class);

    @Autowired
    private RestTemplate restTemplate;

    @Value("${deepseek.api.key}")
    private String apiKey;

    @Scheduled(cron = "0 0 0,12,17 * * ?")
    public void autoGenerateMorningNews() {
        logger.info("【定时任务触发】开始自动生成报文...");
        callDeepSeekApi();
    }
    /**
     * 获取今日报文（核心逻辑：先查库，没有再调 AI）
     */
    public DailyNews getTodayNews() {
        String today = LocalDate.now().toString();
        DailyNews newNews = new DailyNews();
        newNews=NewsDao.findByDate(today);
        if (newNews == null) {
            callDeepSeekApi();
            newNews=NewsDao.findByDate(today);
            return newNews;
        }

        return newNews;
    }

    /**
     * 调用 DeepSeek API
     */
    private String callDeepSeekApi() {
        String today = LocalDate.now().toString();
        int hour = LocalTime.now().getHour();
        String newsType = "早报";
        if (hour >= 12 && hour <= 16) {
            newsType = "午报";
        } else if (hour >= 17) {
            newsType = "晚报";
        }
        String apiUrl = "https://api.deepseek.com/chat/completions";

        // 设置请求头
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        // 构建请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "deepseek-chat");

        List<Map<String, String>> messages = new ArrayList<>();

        Map<String, String> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        systemMsg.put("content", "你是一个温柔的邻家大姐姐，生成一段"+newsType+"。不要输出多余的废话。"+
                "要求：" +
                "1. 字数在 100 字左右。" +
                "2. 注意语气要接地气" +
                "3. 不要安慰，不要劝人积极向上，轻微给予关心与理解，并且关心点到为止即可" +
                "4. 要让人感到这里可以是舒服放松休息的港湾"+
                "5. 开场白简短，只需要带有时间+问候。不要说例如“早报来了”等出戏的话。"+
                "6. 话语不要太刻意，以上规则是方向，不要像完成任务一样"+
                "7. 像朋友聊天一样，适量地引入关于动漫梗参与对话，开开玩笑，不要出现动漫名字和角色名字");
        messages.add(systemMsg);

        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", "请生成当前时段的"+newsType+"。");
        messages.add(userMsg);

        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, entity, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && body.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
                Map<String, Object> firstChoice = choices.get(0);
                Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
                DailyNews newNews = new DailyNews();
                newNews.setNewsDate(today);
                newNews.setContent((String) message.get("content"));
                NewsDao.insert(newNews);
                logger.info(newsType+"已生成并成功保存至数据库");
                return null;
            }
        } catch (Exception e) {
            logger.error("调用 DeepSeek 异常", e);
        }
        return null;
    }
}