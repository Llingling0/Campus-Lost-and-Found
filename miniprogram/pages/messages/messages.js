const { request } = require('../../utils/request');

Page({
  data: { list: [] },
  async onShow() {
    try {
      const list = await request({ url: '/notifications', needAuth: true });
      this.setData({ list });
    } catch (err) {
      wx.showToast({ icon: 'none', title: err.message });
    }
  },
  async readOne(e) {
    const id = e.currentTarget.dataset.id;
    await request({ url: `/notifications/${id}/read`, method: 'POST', needAuth: true });
    this.onShow();
  }
});
