// 本地界面偏好：只保存在当前浏览器，不会上传到后端
export var SETTINGS_KEY = 'animehub.settings';

export var DEFAULT_SETTINGS = {
  sortField: 'id',
  sortOrder: 'DESC',
};

export function getStoredSettings() {
  try {
    var raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return {
        sortField: DEFAULT_SETTINGS.sortField,
        sortOrder: DEFAULT_SETTINGS.sortOrder,
      };
    }

    var parsed = JSON.parse(raw);
    var field = parsed.sortField;
    var order = parsed.sortOrder;

    if (field !== 'id' && field !== 'name' && field !== 'createTime' && field !== 'updateTime') {
      field = DEFAULT_SETTINGS.sortField;
    }
    if (order !== 'ASC' && order !== 'DESC') {
      order = DEFAULT_SETTINGS.sortOrder;
    }

    return {
      sortField: field,
      sortOrder: order,
    };
  } catch (error) {
    return {
      sortField: DEFAULT_SETTINGS.sortField,
      sortOrder: DEFAULT_SETTINGS.sortOrder,
    };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    return false;
  }
}