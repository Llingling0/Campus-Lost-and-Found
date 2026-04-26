# 校园失物招领系统 - 微信小程序端

## 快速开始

### 1. 配置后端地址

编辑 `app.js` 文件，修改 `baseURL` 为实际的后端服务地址：

```javascript
App({
  globalData: {
    baseURL: 'http://localhost:3000/api/v1',  // 本地调试
    // baseURL: 'https://your-domain.com/api/v1',  // 生产环境
    token: '',
    cloudEnvId: '',
    useCloud: false
  }
})
```

### 2. 微信开发者工具设置

1. 打开微信开发者工具
2. 导入项目：选择 `miniprogram` 目录
3. 关闭"校验合法域名"（开发模式）：
   - 点击右上角「详情」
   - 「本地设置」标签
   - 勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」

### 3. 启动测试

1. 确保后端服务已启动：`cd backend && npm run dev`
2. 在微信开发者工具中编译运行

## 功能模块

### 首页 (`/pages/index/index`)
- [x] 搜索框（关键词搜索）
- [x] 分类筛选（全部/失物/招领）
- [x] 校园公告展示
- [x] 统计概览（总发布数、已找回、找回率）
- [x] 信息列表（图片、标题、地点、时间）
- [x] 点击跳转详情

### 详情页 (`/pages/detail/detail`)
- [x] 完整信息展示（标题、描述、图片）
- [x] 元信息（类型、地点、时间、状态）
- [x] 联系方式展示
- [x] 认领申请功能
- [x] 相关推荐（智能匹配）
- [x] 下拉刷新

### 发布页 (`/pages/publish/publish`)
- [x] 类型选择（失物/招领）
- [x] 物品名称、分类选择
- [x] 时间、地点输入
- [x] 详细描述（多行文本）
- [x] 图片上传（最多 5 张）
- [x] 悬赏金额（失物可选）
- [x] 存放地点、联系方式（招领必填）
- [x] 草稿保存
- [x] 提交审核
- [x] 编辑已有信息

### 消息页 (`/pages/messages/messages`)
- [x] 消息列表（标题、内容、时间）
- [x] 未读/已读标记
- [x] 点击标记为已读
- [x] 支持下拉刷新

### 我的页 (`/pages/mine/mine`)
- [x] 微信登录
- [x] 管理员登录（模拟）
- [x] 实名认证绑定（学号/工号、姓名、手机号）
- [x] 用户信息展示
- [x] 我的发布列表
  - 查看详情
  - 编辑草稿/驳回信息
  - 提交审核
  - 删除
- [x] 我的认领入口
- [x] 管理员入口（仅管理员可见）

### 认领页 (`/pages/claims/claims`)
- [x] 认领记录列表
- [x] 状态筛选（全部/待处理/已通过/已拒绝）
- [x] 验证信息展示
- [x] 撤销申请（待处理状态）

### 管理后台 (`/pages/admin/admin`)
- [x] 待审核信息列表
- [x] 审核操作（通过/驳回/删除）
- [x] 待处理认领列表
- [x] 认领审批（通过/拒绝）
- [x] 用户管理（禁用/解禁）
- [x] 数据统计查看
- [x] CSV 导出

## API 接口说明

### 认证接口
```javascript
// 微信登录
POST /auth/wx-login
{ code: string }

// 绑定身份
POST /auth/bind-identity
{ token, identityType, identityNo, realName, mobile }

// 获取个人信息
GET /auth/profile (需要登录)
```

### 帖子接口
```javascript
// 获取分类
GET /posts/categories

// 获取列表
GET /posts?postType=&keyword=&status=&pageNo=&pageSize=

// 获取详情
GET /posts/:id

// 获取推荐
GET /posts/:id/recommendations

// 发布
POST /posts (需要登录)
{ postType, title, categoryId, occurTime, occurLocation, detail, contactInfo, rewardAmount, depositLocation, images, isDraft }

// 更新
PUT /posts/:id (需要登录)

// 提交审核
POST /posts/:id/submit (需要登录)

// 删除
DELETE /posts/:id (需要登录)

// 我的发布
GET /posts/mine/list (需要登录)
```

### 认领接口
```javascript
// 发起认领
POST /claims (需要登录)
{ postId, verifyDesc, evidenceImages }

// 我的认领
GET /claims/my (需要登录)

// 撤销认领
POST /claims/:id/cancel (需要登录)
```

### 通知接口
```javascript
// 获取通知列表
GET /notifications (需要登录)

// 标记已读
POST /notifications/:id/read (需要登录)

// 全部已读
POST /notifications/read-all (需要登录)
```

### 管理接口
```javascript
// 待审核列表
GET /admin/posts/pending (需要管理员)

// 审核通过
POST /admin/posts/:id/approve (需要管理员)

// 审核驳回
POST /admin/posts/:id/reject (需要管理员)

// 用户列表
GET /admin/users (需要管理员)

// 禁用用户
POST /admin/users/:id/disable (需要管理员)

// 统计概览
GET /admin/stats/overview (需要管理员)

// 导出 CSV
GET /admin/stats/export (需要管理员)
```

## 测试账号

### 普通用户
- 在「我的」页面点击「微信登录」
- 任意微信 code 即可创建/登录

### 管理员
- 方式 1：在「我的」页面点击「管理员登录」
- 方式 2：调用登录接口传入 `code: "admin"`

## 样式规范

### 颜色变量
- 主色：`#0b6cff`
- 渐变：`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- 成功：`#4caf50`
- 警告：`#ff9800`
- 危险：`#f44336`
- 背景：`#f5f6f8`
- 卡片：`#fff`

### 尺寸规范
- 页面边距：`20rpx`
- 卡片内边距：`24rpx`
- 卡片间距：`20rpx`
- 圆角：`8rpx` / `12rpx`

## 常见问题

### Q: 图片上传失败？
- 检查后端 `/uploads` 目录是否有写权限
- 确认图片大小不超过 5MB
- 检查网络连接

### Q: 登录态过期？
- token 有效期 7 天
- 过期后重新登录即可
- 异常自动清空本地 token

### Q: 小程序正式版注意事项
1. 必须配置 HTTPS 域名
2. 需要在微信公众平台配置服务器域名白名单
3. 图片上传需使用云存储或 CDN
4. 微信登录需要有效的 AppID 和 AppSecret

## 目录结构

```
miniprogram/
├── pages/
│   ├── index/        # 首页
│   ├── detail/       # 详情页
│   ├── publish/      # 发布页
│   ├── messages/     # 消息页
│   ├── mine/         # 我的页
│   ├── claims/       # 认领页
│   └── admin/        # 管理后台
├── utils/
│   └── request.js    # 请求封装
├── app.js            # 全局逻辑
├── app.json          # 全局配置
├── app.wxss          # 全局样式
├── project.config.json
└── sitemap.json
```

## 开发指南

### 添加新页面
1. 在 `pages/` 下创建新目录
2. 创建 4 个必要文件：`.js`, `.json`, `.wxml`, `.wxss`
3. 在 `app.json` 的 `pages` 数组中添加路径

### 调用 API
```javascript
const { request } = require('../../utils/request');

// 无需认证
const data = await request({ url: '/posts' });

// 需要认证
const data = await request({ 
  url: '/auth/profile', 
  needAuth: true 
});

// POST 请求
await request({ 
  url: '/posts', 
  method: 'POST', 
  data: { ... },
  needAuth: true 
});
```

### 样式复用
全局样式已定义在 `app.wxss`，页面级样式在各自 `.wxss` 文件中。

## 更新日志

### v1.0 (2026-03-27)
- ✅ 基础功能完整实现
- ✅ UI 样式优化
- ✅ 智能搜索与匹配
- ✅ 管理后台功能
- ✅ 定时任务（超时自动处理）

## 技术支持

遇到问题请查看：
- 项目根目录 README.md
- 后端文档：`backend/AUTH_GUIDE.md`, `backend/NOTIFY_GUIDE.md`
- PC 端文档：`web-frontend/README.md`
