const app = getApp();

function request({ url, method = 'GET', data = {}, needAuth = false, header = {} }) {
  return new Promise((resolve, reject) => {
    const h = { ...header };
    if (needAuth && app.globalData.token) {
      h.Authorization = `Bearer ${app.globalData.token}`;
    }
    
    const fullUrl = `${app.globalData.baseURL}${url}`;
    console.log('【request】请求 URL:', fullUrl);
    console.log('【request】请求参数:', data);
    
    wx.request({
      url: fullUrl,
      method,
      data,
      header: h,
      success: (res) => {
        console.log('【request】响应状态码:', res.statusCode);
        console.log('【request】响应数据:', res.data);
        
        const body = res.data || {};
        if (body.code === 0) resolve(body.data);
        else reject(new Error(body.message || '请求失败'));
      },
      fail: (err) => {
        console.error('【request】请求失败:', err);
        reject(err);
      }
    });
  });
}

module.exports = { request };
