package com.zero.bookSystem.utils;

import net.sourceforge.pinyin4j.PinyinHelper;
import net.sourceforge.pinyin4j.format.HanyuPinyinCaseType;
import net.sourceforge.pinyin4j.format.HanyuPinyinOutputFormat;
import net.sourceforge.pinyin4j.format.HanyuPinyinToneType;
import net.sourceforge.pinyin4j.format.exception.BadHanyuPinyinOutputFormatCombination;

public class PinyinUtils {

    /**
     * 获取字符串的拼音首字母（大写）
     */
    public static String getFirstLetters(String chinese) {
        if (chinese == null || chinese.isEmpty()) {
            return "";
        }

        StringBuilder pinyinStr = new StringBuilder();
        char[] newChar = chinese.toCharArray();

        // 设置拼音格式：不带音调，全部大写
        HanyuPinyinOutputFormat defaultFormat = new HanyuPinyinOutputFormat();
        defaultFormat.setCaseType(HanyuPinyinCaseType.UPPERCASE);
        defaultFormat.setToneType(HanyuPinyinToneType.WITHOUT_TONE);

        for (char c : newChar) {
            // 1. 如果本来就是英文字母，直接转大写拼进去
            if (String.valueOf(c).matches("^[a-zA-Z]$")) {
                pinyinStr.append(String.valueOf(c).toUpperCase());
            }
            // 2. 如果是汉字，提取首字母
            else if (String.valueOf(c).matches("[\\u4E00-\\u9FA5]")) {
                try {
                    String[] pinyinArray = PinyinHelper.toHanyuPinyinStringArray(c, defaultFormat);
                    // 很多汉字是多音字（比如“重”），pinyinArray 会有多个结果，我们默认取第一个
                    if (pinyinArray != null && pinyinArray.length > 0) {
                        pinyinStr.append(pinyinArray[0].charAt(0));
                    }
                } catch (BadHanyuPinyinOutputFormatCombination e) {
                    e.printStackTrace();
                }
            }
        }
        return pinyinStr.toString();
    }
}