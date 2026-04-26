App({
  globalData: {
    baseURL: 'http://localhost:3000/api/v1',
    token: '',
    // 预留云开发环境ID，当前保持本地调试不启用
    cloudEnvId: 'cloud1-1g20pucec7c67946',
    useCloud: false
  },
  onLaunch() {
    const token = wx.getStorageSync('token') || '';
    this.globalData.token = token;
  }
});
