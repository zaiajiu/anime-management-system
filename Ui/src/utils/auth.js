// localStorage 的 key
var TOKEN_KEY = 'token';
var USER_ID_KEY = 'userId';
var USERNAME_KEY = 'username';
var ROLE_KEY = 'role'

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

//判断登录状态（是否有token）
export function isLogin() {
  var token = getToken();
  console.log("登录状态Token: ",token)
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

//读取权限
export function getRole(){
  var value =localStorage.getItem(ROLE_KEY);
  if(value === null){
    return '';
  }
  return value;
}

export function setRole(role){
  localStorage.setItem(ROLE_KEY,role);
}

/**
 * ★ 清空所有登录信息
 * AuthRoute 发现后端未登录时调这个
 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(ROLE_KEY);
}