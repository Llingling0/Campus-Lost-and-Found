const { request } = require('../../utils/request');

Page({
  data: {
    editingId: null,
    editingStatus: null,
    form: {
      postType: 1,
      title: '',
      categoryId: null,
      occurTime: '',
      occurLocation: '',
      detail: '',
      contactInfo: '',
      rewardAmount: 0,
      depositLocation: '',
      images: []
    },
    categories: [],
    categoryIndex: 0
  },

  async onLoad(query) {
    const id = query && query.id ? String(query.id) : null;
    if (!id) return;
    await this.loadEditingPost(id);
  },

  async onShow() {
    const categories = await request({ url: '/posts/categories' });
    const categoryId = this.data.form.categoryId;
    const idx = categoryId ? categories.findIndex(c => c.id === categoryId) : 0;
    this.setData({ categories, categoryIndex: idx >= 0 ? idx : 0 });
  },

  async loadEditingPost(id) {
    const post = await request({ url: `/posts/${id}` });
    const imgUrls = (post.images || []).map(it => it.imgUrl).filter(Boolean);
    this.setData({
      editingId: id,
      editingStatus: post.status,
      form: {
        postType: post.post_type,
        title: post.title,
        categoryId: post.category_id,
        occurTime: post.occur_time || '',
        occurLocation: post.occur_location || '',
        detail: post.detail || '',
        contactInfo: post.contact_info || '',
        rewardAmount: post.reward_amount || 0,
        depositLocation: post.deposit_location || '',
        images: imgUrls
      }
    });
  },

  bindField(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`form.${key}`]: e.detail.value });
  },

  onType(e) { this.setData({ 'form.postType': Number(e.currentTarget.dataset.type) }); },

  onCategory(e) {
    const idx = Number(e.detail.value);
    this.setData({ 'form.categoryId': this.data.categories[idx]?.id || null });
  },

  pickImage() {
    wx.chooseImage({
      count: 5 - (this.data.form.images?.length || 0),
      success: (res) => {
        const currentImages = this.data.form.images || [];
        this.setData({
          'form.images': [...currentImages, ...res.tempFilePaths]
        });
      }
    });
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.form.images];
    images.splice(index, 1);
    this.setData({ 'form.images': images });
  },

  async submit(e) {
    const isDraft = e.currentTarget.dataset.draft === '1';
    try {
      const imgUrls = [];
      for (const img of this.data.form.images) {
        // img 可能是已有的 http URL，也可能是本地临时路径（chooseImage 返回）
        if (typeof img === 'string' && img.startsWith('http')) {
          imgUrls.push(img);
          continue;
        }
        const up = await this.upload(img);
        imgUrls.push(`http://localhost:3000${up.url}`);
      }

      if (this.data.editingId) {
        // 编辑模式：草稿保存=更新内容但不改状态；提交审核=调用 /submit
        const payload = { ...this.data.form, images: imgUrls, isDraft };
        await request({
          url: `/posts/${this.data.editingId}`,
          method: 'PUT',
          data: payload,
          needAuth: true
        });
        if (!isDraft) {
          await request({ url: `/posts/${this.data.editingId}/submit`, method: 'POST', data: {}, needAuth: true });
          wx.showToast({ title: '提交成功' });
        } else {
          wx.showToast({ title: '草稿已保存' });
        }
      } else {
        // 新建模式
        const payload = { ...this.data.form, images: imgUrls, isDraft };
        await request({ url: '/posts', method: 'POST', data: payload, needAuth: true });
        wx.showToast({ title: isDraft ? '草稿已保存' : '提交成功' });
      }

      this.setData({
        editingId: null,
        editingStatus: null,
        form: { postType: 1, title: '', categoryId: null, occurTime: '', occurLocation: '', detail: '', contactInfo: '', rewardAmount: 0, depositLocation: '', images: [] }
      });
    } catch (err) {
      wx.showToast({ icon: 'none', title: err.message });
    }
  },

  upload(filePath) {
    const app = getApp();
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${app.globalData.baseURL}/uploads/image`,
        filePath,
        name: 'file',
        success: (res) => {
          const body = JSON.parse(res.data || '{}');
          if (body.code === 0) resolve(body.data);
          else reject(new Error(body.message || '上传失败'));
        },
        fail: reject
      });
    });
  }
});
