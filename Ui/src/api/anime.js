import logger from '@/utils/logger';

const BASE_URL = 'http://localhost:8080/api/anime';

function checkResponseStatus(response) {
  if (response.ok === false) {
    logger.error('animeApi', 'HTTP 状态异常', { status: response.status });
    throw new Error('网络错误：' + response.status);
  }
  return response;
}

function checkLoginStatus(json) {
  if (json.success === false && json.message === '未登录') {
    logger.warn('animeApi', '未登录，跳转登录页');
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
      return json;
    })
    .catch(function (error) {
      logger.error('animeApi', '获取token失败', error);
      throw error;
    });
  
}

// ============================================================
// 1. 获取分页列表：GET /api/anime/list?page=1
// ============================================================
export function fetchAnimeList(page) {
  var currentPage = page || 1;
  var url = BASE_URL + '/list?page=' + currentPage;

  return fetch(url, { method: 'GET', credentials: 'include' })
    .then(checkResponseStatus)
    .then(function (response) { return response.json(); })
    .then(function (json) {
      json = checkLoginStatus(json);
      return json;
    })
    .catch(function (error) {
      logger.error('animeApi', '获取列表失败', error);
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
      logger.error('animeApi', '获取总数失败', error);
      throw error;
    });
}

// ============================================================
// 3. 按名称搜索：GET /api/anime/name?animeName=xxx
// ============================================================
export function fetchAnimeByName(animeName) {
  var url = BASE_URL + '/name?animeName=' + encodeURIComponent(animeName);

  return fetch(url, { method: 'GET', credentials: 'include' })
    .then(checkResponseStatus)
    .then(function (response) { return response.json(); })
    .then(function (json) {
      json = checkLoginStatus(json);
      logger.info('animeApi', '获取动漫成功', json);
      return json;
    })
    .catch(function (error) {
      logger.error('animeApi', '按名称搜索失败', error);
      throw error;
    });
}

// ============================================================
// 4. 其他接口
// ============================================================
export function fetchAnimeById(id) {
  return fetch(BASE_URL + '/' + id, { method: 'GET', credentials: 'include' })
    .then(checkResponseStatus)
    .then(function (res) { return res.json(); })
    .then(function (json) { return checkLoginStatus(json); });
}

export function createAnime(params) {
  var formData = new FormData();
  formData.append('animeName', params.animeName);
  formData.append('animeIntroduction', params.animeIntroduction || '');
  formData.append('animeComment', params.animeComment || '');
  logger.info("animeApi","token:",params.token);
  if (params.Token) formData.append('token',params.Token);
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