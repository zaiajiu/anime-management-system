import logger from '@/utils/logger';

const BASE_URL = 'http://localhost:8080/api/news';
function checkResponseStatus(response) {
  if (response.ok === false) {
    logger.error('NewspaperApi', 'HTTP 状态异常', { status: response.status });
    throw new Error('网络错误：' + response.status);
  }
  return response;
}
// 检查登录状态
function checkLoginStatus(json) {
  if (json.success === false && json.message === '未登录') {
    localStorage.clear();
    window.location.href = '/login';
  }
  return json;
}
export function getNewspaperNews() {
  var url = BASE_URL + '/Newspaper';

  return fetch(url, { method: 'GET', credentials: 'include' })
    .then(checkResponseStatus)
    .then(function (response) { return response.json(); })
    .then(function (json) {
      json = checkLoginStatus(json);
      
      return json;
    })
    .catch(function (error) {
      logger.error('NewspaperApi', '获取报文失败', error);
      throw error;
    });
}