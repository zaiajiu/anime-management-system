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
     * 获取今日早报（核心逻辑：先查库，没有再调 AI）
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
        systemMsg.put("content", "你是一个元气满满，幽默风趣的二次元电台播音员。请用非常接地气的，带有一些轻微二次元元素的，带有鼓励意味的语气生成一段刊文。不要输出多余的废话。"+
                "规则：" +
                "1. 每条字数在 35 字以内。" +
                "2. 必须带点幽默感或吐槽，千万别像官方新闻稿那么死板。" +
                "3. 适当使用 emoji 表情包增加活力。" +
                "4. 不要输出多余的开场白。"+
                "5. 开场白简短，只需要带有时间+问候，例如‘现在是某年+某月+某天+早上/中文/下午。今天是新的开始或今早有发生什么有趣的事吗或者今天结束了，好好吃饭真棒呢’。按照当天时段进行随机变化"+
                "6. 必须是积极，带有轻微鼓励，关心的语气。适当运用二次元，动漫的人物，事件等"+
                "7. 当前时间为0-11时生成早报，12-16时生成午报，17-23时生成晚报。");
        messages.add(systemMsg);

        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", "请生成当前时段的报文。");
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
                logger.info("报文已生成并成功保存至数据库");
                return null;
            }
        } catch (Exception e) {
            logger.error("调用 DeepSeek 异常", e);
        }
        return null;
    }
}