const { request } = require('../../utils/request');

Page({
  data: {
    user: null,
    identityNo: '',
    realName: '',
    mobile: '',
    identityType: 1,
    myPosts: [],
    claims: []
  },

  async onShow() {
    const token = wx.getStorageSync('token');
    if (!token) return;
    const app = getApp();
    app.globalData.token = token;
    await this.loadMine();
  },

  input(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [key]: e.detail.value });
  },

  async wxLogin() {
    try {
      const codeRes = await new Promise((resolve, reject) => wx.login({ success: resolve, fail: reject }));
      const data = await request({ url: '/auth/wx-login', method: 'POST', data: { code: codeRes.code || String(Date.now()) } });
      wx.setStorageSync('token', data.token);
      getApp().globalData.token = data.token;
      this.setData({ user: data.user });
      await this.loadMine();
    } catch (err) {
      wx.showToast({ icon: 'none', title: err.message || '登录失败' });
    }
  },

  async adminLogin() {
    wx.showModal({
      title: '管理员登录',
      editable: true,
      placeholderText: '请输入管理员密码',
      success: async (res) => {
        if (res.confirm) {
          try {
            const password = res.content || '';
            const data = await request({
              url: '/auth/admin-login',
              method: 'POST',
              data: { username: 'admin', password: password || 'admin123' }
            });
            wx.setStorageSync('token', data.token);
            getApp().globalData.token = data.token;
            this.setData({ user: data.user });
            wx.showToast({ title: '管理员登录成功' });
            // 自动跳转到管理员页面
            setTimeout(() => {
              wx.navigateTo({ url: '/pages/admin/admin' });
            }, 800);
            await this.loadMine();
          } catch (err) {
            wx.showToast({ icon: 'none', title: err.message || '管理员登录失败' });
          }
        }
      }
    });
  },

  async bindIdentity() {
    const token = wx.getStorageSync('token') || '';
    const identityNo = String(this.data.identityNo || '').trim();
    const realName = String(this.data.realName || '').trim();
    const mobile = String(this.data.mobile || '').trim();

    if (!token) {
      wx.showToast({ icon: 'none', title: '请先微信登录' });
      return;
    }
    if (!identityNo || !realName || !mobile) {
      wx.showToast({ icon: 'none', title: '请填写学号/工号、真实姓名、手机号' });
      return;
    }

    try {
      await request({
        url: '/auth/bind-identity',
        method: 'POST',
        data: {
          token,
          identityType: Number(this.data.identityType),
          identityNo,
          realName,
          mobile
        }
      });
      wx.showToast({ title: '绑定成功' });
      await this.loadMine();
    } catch (err) {
      wx.showToast({ icon: 'none', title: err.message || '绑定失败' });
    }
  },

  async loadMine() {
    try {
      const user = await request({ url: '/auth/profile', needAuth: true });
      const myPosts = await request({ url: '/posts/mine/list', needAuth: true });
      const claims = await request({ url: '/claims/my', needAuth: true });
      this.setData({ user, claims, myPosts });
    } catch (err) {
      // 登录态异常时，避免直接把堆栈抛到模拟器控制台
      this.setData({ user: null, claims: [], myPosts: [] });
    }
  },

  goClaims() {
    wx.navigateTo({ url: '/pages/claims/claims' });
  },

  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' });
  },

  goPostDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  editPost(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/publish/publish?id=${id}` });
  },

  async submitPost(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await request({ url: `/posts/${id}/submit`, method: 'POST', data: {}, needAuth: true });
      wx.showToast({ title: '提交成功' });
      await this.loadMine();
    } catch (err) {
      wx.showToast({ icon: 'none', title: err.message || '提交失败' });
    }
  },

  async deletePost(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await request({ url: `/posts/${id}`, method: 'DELETE', data: {}, needAuth: true });
      wx.showToast({ title: '删除成功' });
      await this.loadMine();
    } catch (err) {
      wx.showToast({ icon: 'none', title: err.message || '删除失败' });
    }
  }
});
