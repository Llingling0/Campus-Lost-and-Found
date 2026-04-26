const { request } = require('../../utils/request');

Page({
  data: {
    user: null,
    dashboard: null,
    pendingPosts: [],
    pendingClaims: [],
    stats: null,
    loading: true
  },

  onShow() {
    this.loadAll();
  },

  async loadAll() {
    this.setData({ loading: true });
    try {
      const user = await request({ url: '/auth/profile', needAuth: true });
      this.setData({ user });
      if (user.role !== 2) {
        wx.showToast({ icon: 'none', title: '无管理员权限' });
        wx.navigateBack();
        return;
      }
      // 加载全景监控看板数据
      await this.loadDashboard();
      // 兼容旧的待审核数据
      await this.loadPending();
      await this.loadStats();
    } catch (e) {
      wx.showToast({ icon: 'none', title: e.message || '加载失败' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadDashboard() {
    try {
      const data = await request({ url: '/admin/dashboard', needAuth: true });
      this.setData({ dashboard: data });
    } catch (e) {
      console.error('加载看板数据失败', e);
    }
  },

  async loadPending() {
    try {
      const pendingPosts = await request({ url: '/admin/posts/pending', needAuth: true });
      const pendingClaims = await request({ url: '/admin/claims/pending', needAuth: true });
      this.setData({ pendingPosts: pendingPosts || [], pendingClaims: pendingClaims || [] });
    } catch (e) {
      console.error('加载待审核数据失败', e);
    }
  },

  async loadStats() {
    try {
      const stats = await request({ url: '/admin/stats/overview', needAuth: true });
      this.setData({ stats });
    } catch (e) {
      console.error('加载统计数据失败', e);
    }
  },

  async approvePost(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await request({ url: `/admin/posts/${id}/approve`, method: 'POST', data: {}, needAuth: true });
      wx.showToast({ title: '通过' });
      this.loadDashboard();
      this.loadPending();
      this.loadStats();
    } catch (e) {
      wx.showToast({ icon: 'none', title: e.message });
    }
  },

  async rejectPost(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await request({ url: `/admin/posts/${id}/reject`, method: 'POST', data: { reason: '信息不完整' }, needAuth: true });
      wx.showToast({ title: '已驳回' });
      this.loadDashboard();
      this.loadPending();
      this.loadStats();
    } catch (e) {
      wx.showToast({ icon: 'none', title: e.message });
    }
  },

  async deletePost(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await request({ url: `/admin/posts/${id}/delete`, method: 'POST', data: { reason: '违规信息' }, needAuth: true });
      wx.showToast({ title: '已删除' });
      this.loadDashboard();
      this.loadPending();
      this.loadStats();
    } catch (e) {
      wx.showToast({ icon: 'none', title: e.message });
    }
  },

  async approveClaim(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await request({ url: `/admin/claims/${id}/approve`, method: 'POST', data: {}, needAuth: true });
      wx.showToast({ title: '认领通过' });
      this.loadDashboard();
      this.loadPending();
      this.loadStats();
    } catch (e) {
      wx.showToast({ icon: 'none', title: e.message });
    }
  },

  async rejectClaim(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await request({ url: `/admin/claims/${id}/reject`, method: 'POST', data: { reason: '验证信息不匹配' }, needAuth: true });
      wx.showToast({ title: '已拒绝' });
      this.loadDashboard();
      this.loadPending();
      this.loadStats();
    } catch (e) {
      wx.showToast({ icon: 'none', title: e.message });
    }
  }
});
