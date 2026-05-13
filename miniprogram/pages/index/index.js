const { request } = require('../../utils/request');

Page({
  data: {
    list: [],
    keyword: '',
    postType: 0, // 0=全部，1=失物，2=招领
    categories: [],
    announcements: [],
    loading: false,
    pageNo: 1,
    pageSize: 20,
    total: 0,
    hasMore: true
  },

  onLoad() {
    console.log('【onLoad】页面加载');
    // 首次加载时获取全部信息（包括失物和招领）
    this.loadList();
    this.loadAnnouncements();
  },

  onShow() {
    console.log('【onShow】页面显示');
    // 每次显示页面时刷新列表
    this.loadList();
  },

  async loadList() {
    console.log('【loadList】开始加载列表，postType:', this.data.postType);
    
    this.setData({ loading: true });
    
    try {
      const { keyword, postType, pageNo, pageSize } = this.data;
      
      // 构建请求参数，postType=0 时不传该参数（显示全部）
      const requestData = {
        keyword: keyword || undefined,
        status: 2,
        pageNo: pageNo,
        pageSize: pageSize
      };
      
      // 只有当 postType 不为 0 时才传递参数
      if (postType !== 0) {
        requestData.postType = postType;
      }
      
      console.log('【请求参数】', requestData);
      
      const data = await request({
        url: '/posts',
        data: requestData
      });
      
      console.log('【返回数据】list 长度:', data.list?.length, '总数:', data.total);
      if (data.list && data.list.length > 0) {
        console.log('【第一条数据】', data.list[0]);
      }
      
      this.setData({ 
        list: data.list || [],
        total: data.total || 0,
        hasMore: (pageNo * pageSize) < (data.total || 0),
        loading: false
      });
      
      console.log('【setData 完成】当前列表长度:', this.data.list.length);
    } catch (e) {
      console.error('【加载列表失败】错误信息:', e.message, e);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  onKeywordInput(e) { 
    this.setData({ keyword: e.detail.value }); 
  },

  onTypeChange(e) {
    const type = Number(e.currentTarget.dataset.type);
    // 切换类型时重置页码为 1
    this.setData({ postType: type, pageNo: 1 }, () => {
      this.loadList();
    });
  },

  onSearch() { 
    // 搜索时重置页码为 1
    this.setData({ pageNo: 1 }, () => {
      this.loadList();
    });
  },

  // 切换页码
  onPageChange(e) {
    const page = Number(e.currentTarget.dataset.page);
    if (page !== this.data.pageNo) {
      this.setData({ pageNo: page }, () => {
        this.loadList();
        // 滚动到列表顶部
        wx.pageScrollTo({ scrollTop: 0, duration: 300 });
      });
    }
  },

  // 上一页
  onPrevPage() {
    const { pageNo } = this.data;
    if (pageNo > 1) {
      this.setData({ pageNo: pageNo - 1 }, () => {
        this.loadList();
        wx.pageScrollTo({ scrollTop: 0, duration: 300 });
      });
    }
  },

  // 下一页
  onNextPage() {
    const { pageNo, hasMore } = this.data;
    if (hasMore) {
      this.setData({ pageNo: pageNo + 1 }, () => {
        this.loadList();
        wx.pageScrollTo({ scrollTop: 0, duration: 300 });
      });
    }
  },

  async loadAnnouncements() {
    try {
      const list = await request({ url: '/announcements' });
      this.setData({ announcements: list || [] });
    } catch (e) {
      console.error('加载公告失败', e);
      this.setData({ announcements: [] });
    }
  },

  goDetail(e) {
    wx.navigateTo({ 
      url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` 
    });
  }
});
