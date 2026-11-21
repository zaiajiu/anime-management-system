const BASE_URL = 'http://localhost:8080/api/anime';
import { clearAuth } from '@/utils/auth'; 

function checkResponseStatus(response) {
  if (response.ok === false) {
    // ★ 如果后端返回 401，说明没登录或 Session 过期了
    if (response.status === 401) {
      console.log('animeApi', '未登录或登录已过期，清空本地信息');
      clearAuth(); // 清空本地假 Token 和角色
      window.location.href = '/login'; // 强制跳回登录页
      throw new Error('登录已过期，请重新登录');
    }
    
    console.log('animeApi', 'HTTP 状态异常', { status: response.status });
    throw new Error('网络错误：' + response.status);
  }
  return response;
}

function checkLoginStatus(json) {
  if (json.success === false && json.message === '未登录') {
    console.log('animeApi', '未登录，跳转登录页');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = '/login';
  }
  return json;
}
//获取token,用于防重提交
export async function fetchGetSubmitToken(){
  var url = BASE_URL + '/getSubmitToken';
  return fetch(url, { method: 'GET', credentials: 'include' })
  .then(checkResponseStatus)
    .then(function (response) { return response.json(); })
    .then(function (json) {
      json = checkLoginStatus(json);
      console.log("tokenJson: ",json)
      return json;
    })
    .catch(function (error) {
      console.log('animeApi', '获取token失败', error);
      throw error;
    });
  
}

// ============================================================
// 1. 获取分页列表：GET /api/anime/list?page=1
// ============================================================
export function fetchAnimeList(page,sortField,sortOrder) {
  var currentPage = page || 1;
  var field = sortField || 'id';
  var order = sortOrder || 'DESC';
  var url = BASE_URL + '/list?page=' + currentPage + '&sortField=' + field + '&sortOrder=' + order;

  return fetch(url, { method: 'GET', credentials: 'include' })
    .then(checkResponseStatus)
    .then(function (response) { return response.json(); })
    .then(function (json) {
      json = checkLoginStatus(json);
      
      return json;
    })
    .catch(function (error) {
      console.log('animeApi', '获取列表失败', error);
      throw error;
    });
}

// ============================================================
// 2. 获取总数：GET /api/anime/count
// ============================================================
export function fetchAnimeCount() {
  var url = BASE_URL + '/count';

  return fetch(url, { method: 'GET', credentials: 'include' })
    .then(checkResponseStatus)
    .then(function (response) { return response.json(); })
    .then(function (json) {
      json = checkLoginStatus(json);
      
      return json;
    })
    .catch(function (error) {
      console.log('animeApi', '获取总数失败', error);
      throw error;
    });
}

// ============================================================
// 3. 按名称搜索：GET /api/anime/name?animeName=xxx
// ============================================================
export function fetchAnimeByName(animeName,page,sortField,sortOrder) {
  var currentPage = page || 1;
  var field = sortField || 'id';
  var order = sortOrder || 'DESC';
  var url = BASE_URL + '/name?animeName=' + encodeURIComponent(animeName)+'&page=' + currentPage + '&sortField=' + field + '&sortOrder=' + order;;

  return fetch(url, { method: 'GET', credentials: 'include' })
    .then(checkResponseStatus)
    .then(function (response) { return response.json(); })
    .then(function (json) {
      json = checkLoginStatus(json);
      console.log('animeApi', '获取动漫成功', json);
      return json;
    })
    .catch(function (error) {
      console.log('animeApi', '按名称搜索失败', error);
      throw error;
    });
    
}
//获取按名称查询的动漫数量
export async function fetchAnimeCountByName(animeName) {
  var url = BASE_URL + '/name/count?animeName=' + encodeURIComponent(animeName);
  var res = await fetch(url, { method: 'GET', credentials: 'include' });
  return res.json();
}

// ============================================================
// 4. 按‘id获取单个动漫，详情页使用
// ============================================================
export function fetchAnimeById(id) {
  return fetch(BASE_URL + '/' + id, { method: 'GET', credentials: 'include' })
    .then(checkResponseStatus)
    .then(function (res) { return res.json(); })
    .then(function (json) { return checkLoginStatus(json); });
}
//添加接口
export function createAnime(params) {
  var formData = new FormData();
  formData.append('animeName', params.animeName);
  formData.append('animeIntroduction', params.animeIntroduction || '');
  formData.append('animeComment', params.animeComment || '');
  console.log("animeApi","token:",params.token);
  console.log("params: ",params.animeName)
  if (params.token) formData.append('token',params.token);
  if (params.image) formData.append('image', params.image);

  return fetch(BASE_URL, { method: 'POST', credentials: 'include', body: formData })
    .then(checkResponseStatus)
    .then(function (res) { return res.json(); })
    .then(function (json) { return checkLoginStatus(json); });
}

export function updateAnime(id, params) {
  var formData = new FormData();
  formData.append('animeName', params.animeName);
  formData.append('animeIntroduction', params.animeIntroduction || '');
  formData.append('animeComment', params.animeComment || '');
  if (params.image) formData.append('image', params.image);

  return fetch(BASE_URL + '/' + id, { method: 'PUT', credentials: 'include', body: formData })
    .then(checkResponseStatus)
    .then(function (res) { return res.json(); })
    .then(function (json) { return checkLoginStatus(json); });
}

export function deleteAnimeBatch(ids) {
  return fetch(BASE_URL + '/batch-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ids: ids })
  })
    .then(checkResponseStatus)
    .then(function (res) { return res.json(); })
    .then(function (json) { return checkLoginStatus(json); });
}