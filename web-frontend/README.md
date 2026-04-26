# PC 端 Web 前端使用指南

## 项目结构

```
web-frontend/
├── src/
│   ├── api/              # API 接口封装
│   │   ├── admin.js      # 管理后台接口
│   │   ├── auth.js       # 认证接口
│   │   ├── message.js    # 消息接口
│   │   └── post.js       # 帖子接口
│   ├── router/           # 路由配置
│   │   └── index.js
│   ├── stores/           # Pinia 状态管理
│   │   ├── notification.js
│   │   └── user.js
│   ├── utils/            # 工具函数
│   │   └── request.js    # Axios 封装
│   ├── views/            # 页面组件
│   │   ├── admin/        # 管理后台页面
│   │   │   ├── Audit.vue
│   │   │   ├── Configs.vue
│   │   │   ├── Index.vue
│   │   │   ├── Stats.vue
│   │   │   └── Users.vue
│   │   ├── auth/
│   │   │   └── Login.vue
│   │   ├── mine/
│   │   │   ├── Claims.vue
│   │   │   └── Posts.vue
│   │   ├── Detail.vue
│   │   ├── Home.vue
│   │   ├── Messages.vue
│   │   ├── PostList.vue
│   │   ├── Profile.vue
│   │   └── Publish.vue
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
└── vite.config.js
```

## 功能清单

### 普通用户功能
✅ 首页 - 搜索、分类筛选、最新信息、公告栏、统计概览
✅ 失物/招领列表 - 搜索、分类筛选、分页
✅ 详情页面 - 图片预览、相关信息推荐、认领申请
✅ 发布信息 - 失物/招领发布、草稿保存、图片上传
✅ 个人中心 - 个人信息、我的发布、我的认领
✅ 消息中心 - 系统通知、已读/未读管理

### 管理员功能
✅ 控制台 - 统计概览、快速入口
✅ 信息审核 - 待审核列表、审核通过/驳回/删除
✅ 认领审核 - 待处理认领、审批通过/拒绝
✅ 用户管理 - 用户列表、禁用/解禁用户
✅ 数据统计 - 数据概览、分类分布图、导出 Excel
✅ 系统设置 - 配置管理、帮助中心

## 启动步骤

### 1. 启动后端服务
```bash
cd backend
npm install
npm run dev
```
后端运行在 http://localhost:3000

### 2. 启动前端服务
```bash
cd web-frontend
npm install
npm run dev
```
前端运行在 http://localhost:8080

## 技术栈

- **前端框架**: Vue 3.4.21
- **UI 组件库**: Element Plus 2.6.1
- **状态管理**: Pinia 2.1.7
- **路由**: Vue Router 4.3.0
- **HTTP 请求**: Axios 1.6.8
- **图表**: ECharts 5.5.0
- **构建工具**: Vite 5.2.8

## API 接口说明

### 认证接口
- `POST /api/v1/auth/wx-login` - 微信登录（模拟）
- `POST /api/v1/auth/bind-identity` - 绑定身份信息
- `GET /api/v1/auth/profile` - 获取个人信息

### 帖子接口
- `GET /api/v1/posts/categories` - 获取分类列表
- `GET /api/v1/posts` - 获取帖子列表
- `GET /api/v1/posts/:id` - 获取帖子详情
- `POST /api/v1/posts` - 发布帖子
- `PUT /api/v1/posts/:id` - 更新帖子
- `DELETE /api/v1/posts/:id` - 删除帖子

### 认领接口
- `POST /api/v1/claims` - 发起认领申请
- `GET /api/v1/claims/my` - 获取我的认领
- `POST /api/v1/claims/:id/cancel` - 撤销认领

### 管理接口
- `GET /api/v1/admin/posts/pending` - 获取待审核帖子
- `POST /api/v1/admin/posts/:id/approve` - 审核通过
- `POST /api/v1/admin/posts/:id/reject` - 审核驳回
- `GET /api/v1/admin/users` - 获取用户列表
- `GET /api/v1/admin/stats/overview` - 统计概览

## 测试账号

### 管理员登录
在后端登录接口传入 `code: "admin"` 即可获得管理员权限

### 普通用户登录
任意 code 值即可创建/登录普通用户账号

## 与需求规格说明书的对应关系

| 需求编号 | 需求名称 | 实现状态 | 对应页面 |
|---------|---------|---------|---------|
| F001 | 用户注册登录 | ✅ | Login.vue |
| F002 | 失物信息发布 | ✅ | Publish.vue |
| F003 | 招领信息发布 | ✅ | Publish.vue |
| F004 | 信息搜索与匹配 | ✅ | Home.vue, PostList.vue |
| F005 | 认领申请与处理 | ✅ | Detail.vue |
| F006 | 信息审核管理 | ✅ | admin/Audit.vue |
| F007 | 消息通知 | ✅ | Messages.vue |
| F008 | 数据统计 | ✅ | admin/Stats.vue |
| F009 | 用户管理 | ✅ | admin/Users.vue |
| F010 | 系统设置 | ✅ | admin/Configs.vue |

## 注意事项

1. **跨域代理**: Vite 配置了代理，将 `/api` 和 `/uploads` 请求转发到后端 3000 端口
2. **Token 存储**: 登录 token 存储在 localStorage 中，有效期 7 天
3. **图片上传**: 单张图片限制 5MB，最多上传 5 张
4. **权限控制**: 管理员页面需要 role=2 才能访问
5. **响应式设计**: 支持 1366×768 及以上分辨率

## 下一步优化方向

1. 对接真实的校园统一身份认证接口
2. 增强智能匹配算法（关键词相似度、时间地点匹配）
3. 接入微信公众号/企业微信消息推送
4. 完善数据可视化图表
5. 添加更多交互效果和用户体验优化
