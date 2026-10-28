package com.zero.bookSystem.common;

/**
 * 统一返回体
 * 所有 Controller 都返回这个类，前端拿到的 JSON 结构永远是：
 * { "success": true/false, "message": "提示信息", "data": {...} }
 *
 * @param <T> data 的具体类型
 */
public class Result<T> {

    /** 是否成功 */
    private boolean success;

    /** 提示信息，成功时一般是 "ok"，失败时是错误原因 */
    private String message;

    /** 业务数据，可以为 null */
    private T data;

    // ===== 构造方法 =====
    public Result() {}

    public Result(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    // ===== 静态工厂方法，方便调用 =====

    /** 成功且带数据 */
    public static <T> Result<T> ok(T data) {
        return new Result<>(true, "ok", data);
    }

    /** 成功无数据 */
    public static <T> Result<T> ok() {
        return new Result<>(true, "ok", null);
    }

    /** 失败，只带错误信息 */
    public static <T> Result<T> fail(String message) {
        return new Result<>(false, message, null);
    }

    // ===== getter / setter：Jackson 序列化 JSON 时需要 =====
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
}