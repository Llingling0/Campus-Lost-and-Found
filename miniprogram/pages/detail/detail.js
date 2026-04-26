const { request } = require('../../utils/request');

Page({
  data: { 
    id: null, 
    detail: null, 
    rec: [], 
    verifyDesc: '',
    loading: false
  },

  async onLoad(query) {
    this.setData({ id: query.id });
    await this.loadDetail();
  },

  async loadDetail() {
    this.setData({ loading: true });
    try {
      const detail = await request({ url: `/posts/${this.data.id}` });
      const rec = await request({ url: `/posts/${this.data.id}/recommendations` });
      this.setData({ detail, rec, loading: false });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  input(e) { 
    this.setData({ verifyDesc: e.detail.value }); 
  },

  async claim() {
    if (!this.data.verifyDesc) {
      wx.showToast({ title: '请填写验证信息', icon: 'none' });
      return;
    }

    try {
      await request({
        url: '/claims',
        method: 'POST',
        needAuth: true,
        data: { 
          postId: Number(this.data.id), 
          verifyDesc: this.data.verifyDesc 
        }
      });
      wx.showToast({ title: '申请已提交', icon: 'success' });
      this.setData({ verifyDesc: '' });
      this.loadDetail();
    } catch (err) {
      wx.showToast({ title: err.message || '提交失败', icon: 'none' });
    }
  },

  onPullDownRefresh() {
    this.loadDetail();
    wx.stopPullDownRefresh();
  }
});
