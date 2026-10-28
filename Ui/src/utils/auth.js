import logger from '@/utils/logger';

// localStorage 的 key
var TOKEN_KEY = 'token';
var USER_ID_KEY = 'userId';
var USERNAME_KEY = 'username';

/**
 * 读取 token
 */
export function getToken() {
  var value = localStorage.getItem(TOKEN_KEY);
  return value;
}

/**
 * 写入 token
 */
export function setToken(token) {

  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * 删除 token
 */
export function removeToken() {

  localStorage.removeItem(TOKEN_KEY);
}

/**
 * 是否已登录（只看本地 token）
 */
export function isLogin() {
  var token = getToken();
  if (token === null) {
    return false;
  }
  return true;
}

/**
 * 读取 userId
 */
export function getUserId() {
  var value = localStorage.getItem(USER_ID_KEY);
  if (value === null) {
    return null;
  }
  var num = Number(value);
  return num;
}

/**
 * 写入 userId
 */
export function setUserId(id) {
  localStorage.setItem(USER_ID_KEY, String(id));
}

/**
 * 读取 username
 */
export function getUsername() {
  var value = localStorage.getItem(USERNAME_KEY);
  if (value === null) {
    return '';
  }
  return value;
}

/**
 * 写入 username
 */
export function setUsername(name) {
  localStorage.setItem(USERNAME_KEY, name);
}

/**
 * ★ 清空所有登录信息
 * AuthRoute 发现后端未登录时调这个
 */
export function clearAuth() {
  logger.debug('auth', '清空所有登录信息');
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USERNAME_KEY);
}