const BASE_URL = 'http://localhost:8080/api/admin';

export async function fetchAllAnime(page = 1, size = 9, sortField = 'id', sortOrder = 'DESC') {
  var res = await fetch(`${BASE_URL}/allAnime?page=${page}&size=${size}&sortField=${sortField}&sortOrder=${sortOrder}`, { credentials: 'include' });
  return res.json();
}

export async function fetchAllUser(page = 1, size = 9, sortField = 'id', sortOrder = 'DESC') {
  var res = await fetch(`${BASE_URL}/allUser?page=${page}&size=${size}&sortField=${sortField}&sortOrder=${sortOrder}`, { credentials: 'include' });
  return res.json();
}

export async function updatePasswordApi(userName, newPassword) {
  var res = await fetch(`${BASE_URL}/updataPassword?userName=${userName}&newPassword=${newPassword}`, {
    method: 'PUT',
    credentials: 'include'
  });
  return res.json();
}

export async function adminBatchDeleteApi(ids) {
  var res = await fetch(`${BASE_URL}/batchDelete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ids: ids })
  });
  return res.json();
}

export async function fetchCountAnime() {
  var res = await fetch(`${BASE_URL}/countAnime`, { credentials: 'include' });
  return res.json();
}

export async function fetchCountUser() {
  var res = await fetch(`${BASE_URL}/countUser`, { credentials: 'include' });
  return res.json();
}

export async function banUserApi(userId) {
  var res = await fetch(`${BASE_URL}/ban?userId=${userId}`, { method: 'POST', credentials: 'include' });
  return res.json();
}

export async function unbanUserApi(userId) {
  var res = await fetch(`${BASE_URL}/unban?userId=${userId}`, { method: 'POST', credentials: 'include' });
  return res.json();
}