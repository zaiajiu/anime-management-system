import logger from '@/utils/logger';

// ============================================================
// 配置区
// ============================================================

// 后端地址
// 如果 application.properties 里配了 context-path
// 比如 server.servlet.context-path=/bookSystem
// 那么这里要改成 'http://localhost:8080/bookSystem/api/user'
var BASE_URL = 'http://localhost:8080/api/user';


// ============================================================
// 通用请求函数：POST JSON
// 所有 POST 接口都通过它发请求
// ============================================================

/**
 * 发送 POST JSON 请求
 * @param {string} path 相对路径，比如 '/login'
 * @param {object} data 请求体数据，会被序列化成 JSON
 * @returns {Promise<object>} 后端返回的 JSON 对象
 */
function postJson(path, data) {
  var fullUrl = BASE_URL + path;



  // 第一步：发请求
  return fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(data)
  })
    // 第二步：检查响应状态
    .then(function (response) {
      if (response.ok === false) {
        logger.error('postJson', 'HTTP 状态异常', {
          url: fullUrl,
          status: response.status
        });
        throw new Error('网络错误：' + response.status);
      }
      return response;
    })
    // 第三步：解析 JSON
    .then(function (response) {
      return response.json();
    })
    // 第四步：打印成功日志并返回
    .then(function (json) {
      return json;
    })
    // 第五步：捕获任何异常
    .catch(function (error) {
      logger.error('postJson', '请求过程出现异常', {
        url: fullUrl,
        error: error
      });
      throw error;
    });
}


// ============================================================
// 通用请求函数：GET
// ============================================================

/**
 * 发送 GET 请求
 * @param {string} path 相对路径，比如 '/info'
 * @returns {Promise<object>} 后端返回的 JSON 对象
 */
function getJson(path) {
  var fullUrl = BASE_URL + path;


  return fetch(fullUrl, {
    method: 'GET',
    credentials: 'include'
  })
    .then(function (response) {
      if (response.ok === false) {
        logger.error('getJson', 'HTTP 状态异常', {
          url: fullUrl,
          status: response.status
        });
        throw new Error('网络错误：' + response.status);
      }
      return response;
    })
    .then(function (response) {
      return response.json();
    })
    .then(function (json) {
      return json;
    })
    .catch(function (error) {
      logger.error('getJson', '请求过程出现异常', {
        url: fullUrl,
        error: error
      });
      throw error;
    });
}


// ============================================================
// 业务接口
// ============================================================

/**
 * 登录
 * @param {string} username 用户名
 * @param {string} password 密码
 * @returns {Promise<object>}
 */
export function loginApi(username, password) {


  var requestData = {
    username: username,
    password: password
  };

  return postJson('/login', requestData);
}


/**
 * 注册
 * @param {string} username 用户名
 * @param {string} password 密码
 * @param {string} confirmPassword 确认密码
 * @returns {Promise<object>}
 */
export function registerApi(username, password, confirmPassword) {

  var requestData = {
    username: username,
    password: password,
    confirmPassword: confirmPassword
  };

  return postJson('/register', requestData);
}

/**
 * 修改密码
 * @param {string} oldPassword 旧密码
 * @param {String} newPassword 新密码
 * @returns {Promise<object>}
 */
export function updatePasswordApi(oldPassword,newPassword){
  var updatePasswordData={
    oldPassword:oldPassword,
    newPassword:newPassword
  };
  return postJson("/updatePassword",updatePasswordData);
}

/**
 * 更新资料
 */
// 更新资料（带文件上传）
export function updateProfileApi(nickname, signature, avatarFile) {
  var formData = new FormData();
  formData.append('nickname', nickname);
  formData.append('signature', signature || '');
  if (avatarFile) {
    formData.append('avatar', avatarFile);
  }

  return fetch(BASE_URL + '/updateProfile', {
    method: 'POST',
    // 不要手写 Content-Type，浏览器会自动加上 multipart/form-data 和 boundary
    credentials: 'include',
    body: formData
  }).then(res => res.json());
}

/**
 * 退出登录
 * @returns {Promise<object>}
 */
export function logoutApi() {
  logger.info('logoutApi', '调用退出接口');

  return postJson('/logout', {});
}


/**
 * 获取当前登录用户信息
 * @returns {Promise<object>}
 */
export function getUserInfoApi() {

  return getJson('/info');
}