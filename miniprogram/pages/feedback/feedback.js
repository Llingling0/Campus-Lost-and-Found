const { request } = require('../../utils/request');

Page({
  data: {
    content: '',
    list: [],
    submitting: false
  },

  onShow() {
    this.fetchMyFeedback();
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  fetchMyFeedback() {
    request({ url: '/api/v1/feedbacks/my', needAuth: true }).then(data => {
      this.setData({ list: data || [] });
    }).catch(() => {});
  },

  submitFeedback() {
    const { content } = this.data;
    if (!content.trim()) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    request({
      url: '/api/v1/feedbacks',
      method: 'POST',
      needAuth: true,
      data: { content: content.trim() }
    }).then(() => {
      wx.showToast({ title: '感谢您的反馈！', icon: 'success' });
      this.setData({ content: '' });
      this.fetchMyFeedback();
    }).catch(() => {}).finally(() => {
      this.setData({ submitting: false });
    });
  }
});
