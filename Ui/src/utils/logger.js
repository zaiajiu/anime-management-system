/**
 * 统一日志工具（啰嗦版）
 * 所有函数都用 function 声明，所有分支都用完整 if/else，
 * 所有返回值都显式 return，不用箭头函数、不用三元运算符。
 */

// ============================================================
// 配置区
// ============================================================

// 开发环境标记：Vite 提供
// - npm run dev   → true
// - npm run build → false
var IS_DEV = import.meta.env.DEV;

// 各个级别的颜色（CSS 字符串）
var COLORS = {
  debug: 'color: #888888',
  info:  'color: #0a84ff',
  warn:  'color: #ff9f0a',
  error: 'color: #ff453a'
};


// ============================================================
// 工具函数：生成时间戳
// ============================================================

/**
 * 生成形如 20:31:40.123 的时间字符串
 * @returns {string}
 */
function getCurrentTimeString() {
  var date = new Date();

  var year = date.getFullYear();
  var month = date.getMonth() + 1;       // 月份从 0 开始，要 +1
  var day = date.getDate();
  var hour = date.getHours();
  var minute = date.getMinutes();
  var second = date.getSeconds();
  var millisecond = date.getMilliseconds();

  // 补零：数字 5 → "05"，数字 12 → "12"
  function padNumber(num, length) {
    var str = String(num);
    while (str.length < length) {
      str = '0' + str;
    }
    return str;
  }

  var hourStr = padNumber(hour, 2);
  var minuteStr = padNumber(minute, 2);
  var secondStr = padNumber(second, 2);
  var millisecondStr = padNumber(millisecond, 3);

  var result = hourStr + ':' + minuteStr + ':' + secondStr + '.' + millisecondStr;
  return result;
}


// ============================================================
// 核心函数：判断某个级别在当前环境下是否要输出
// ============================================================

/**
 * 检查是否需要输出这个级别的日志
 * @param {string} level 日志级别：debug / info / warn / error
 * @returns {boolean}
 */
function shouldOutput(level) {
  // 生产环境：只输出 warn 和 error
  if (IS_DEV === false) {
    if (level === 'warn') {
      return true;
    }
    if (level === 'error') {
      return true;
    }
    return false;
  }

  // 开发环境：全部输出
  return true;
}


// ============================================================
// 核心函数：根据级别选择 console 的方法
// ============================================================

/**
 * 返回一个 console 方法（log / warn / error）
 * @param {string} level
 * @returns {Function}
 */
function getConsoleMethod(level) {
  if (level === 'error') {
    return console.error;
  }
  if (level === 'warn') {
    return console.warn;
  }
  // debug 和 info 都用 console.log
  return console.log;
}


// ============================================================
// 核心函数：真正执行打印
// ============================================================

/**
 * 输出一条日志
 * @param {string} level   级别：debug / info / warn / error
 * @param {string} module  模块名，比如 "LoginPage"
 * @param {string} message 描述，比如 "用户点击登录"
 * @param {*}      data    可选，附加数据（对象、字符串、错误等）
 */
function output(level, module, message, data) {
  // 第一步：判断这个级别在当前环境下要不要输出
  var needOutput = shouldOutput(level);
  if (needOutput === false) {
    return;
  }

  // 第二步：生成时间戳
  var timeString = getCurrentTimeString();

  // 第三步：拼接前缀（带 %c，方便上色）
  // 结果形如：[20:31:40.123] [INFO] [LoginPage]
  var levelUpper = level.toUpperCase();
  var prefix = '%c[' + timeString + '] [' + levelUpper + '] [' + module + ']';

  // 第四步：取对应颜色
  var colorStyle = COLORS[level];

  // 第五步：选 console 方法
  var consoleMethod = getConsoleMethod(level);

  // 第六步：根据有没有 data 决定怎么打
  if (typeof data === 'undefined') {
    // 没有 data：三参数
    consoleMethod(prefix, colorStyle, message);
  } else {
    // 有 data：四参数
    consoleMethod(prefix, colorStyle, message, data);
  }
}


// ============================================================
// 对外暴露的 logger 对象
// 每个方法都是完整 function 形式
// ============================================================

var logger = {

  /**
   * 调试级日志：只在开发环境输出
   */
  debug: function (module, message, data) {
    output('debug', module, message, data);
  },

  /**
   * 信息级日志：只在开发环境输出
   */
  info: function (module, message, data) {
    output('info', module, message, data);
  },

  /**
   * 警告级日志：开发和生产都输出
   */
  warn: function (module, message, data) {
    output('warn', module, message, data);
  },

  /**
   * 错误级日志：开发和生产都输出
   */
  error: function (module, message, data) {
    output('error', module, message, data);
  }

};

export default logger;