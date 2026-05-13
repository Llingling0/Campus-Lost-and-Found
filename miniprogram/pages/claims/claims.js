const { request } = require('../../utils/request');

Page({
  data: { list: [] },
  async onShow() {
    try {
      const list = await request({ url: '/claims/my', needAuth: true });
      this.setData({ list });
    } catch (e) {
      wx.showToast({ icon: 'none', title: e.message });
    }
  }
});
