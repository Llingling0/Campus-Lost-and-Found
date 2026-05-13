# Campus-Lost-and-Found
# 校园失物招领系统

> 支持微信小程序 + PC 端网页双平台

## 项目结构
- `backend`: Node.js + Express + SQLite 后端服务
- `miniprogram`: 微信小程序前端
- `web-frontend`: PC 端 Vue.js 网页前端（新增）

## 已实现功能

### 普通用户功能
- 用户：微信登录/网页登录、身份绑定、个人信息、我的发布、我的认领
- 信息：失物/招领发布、草稿、提交审核、列表筛选、详情、推荐、删除
- 认领：发起认领、查询、撤销
- 搜索：关键词搜索、分类筛选、时间范围筛选
- 通知：审核与认领消息通知、已读/全部已读

### 管理员功能
- 信息审核：审核通过/驳回/删除
- 认领审批：认领申请审批
- 用户管理：用户列表、禁用/解禁
- 数据统计：统计概览、数据导出 CSV
- 配置管理：系统参数配置
- 公告管理：公告发布与管理

### 系统特性
- 定时规则：认领 72 小时超时自动驳回、发布 90 天自动过期
- 权限控制：基于 JWT 的角色权限管理
- 图片上传：支持最多 5 张图片，单张≤5MB

## 本地启动

### 方式一：微信小程序
1. 启动后端
```bash
cd backend
npm install
npm run dev
```
2. 打开微信开发者工具，导入 `miniprogram` 目录
3. 在开发者工具中关闭"校验合法域名"或将接口域名加入白名单
4. 启动后访问小程序即可测试

### 方式二：PC 端网页（新增）
1. 启动后端（同上）
```bash
cd backend
npm install
npm run dev
```
2. 启动前端
```bash
cd web-frontend
npm install
npm run dev
```
3. 访问 http://localhost:8080

## 测试账号
- 管理员：`wx.login` code 传 `admin`（可用 Postman 调 `POST /api/v1/auth/wx-login`）
- 普通用户：任意 code

## 技术栈
- **后端**: Node.js + Express + SQLite (better-sqlite3)
- **小程序**: 原生微信小程序框架
- **PC 前端**: Vue 3 + Element Plus + Vite + Pinia + ECharts

## 需要你介入时我会暂停
以下事项需要你提供真实环境信息：
- 校园统一身份认证接口（当前是本地模拟绑定）
- 微信订阅消息模板 ID 与发送权限（当前是站内通知）
- 服务器域名与 HTTPS 证书（小程序正式版必需）

## 详细文档
- PC 端使用说明：[web-frontend/README.md](web-frontend/README.md)
- 小程序端说明：[miniprogram/README.md](miniprogram/README.md)
- 身份认证指南：[backend/AUTH_GUIDE.md](backend/AUTH_GUIDE.md)
- 消息推送指南：[backend/NOTIFY_GUIDE.md](backend/NOTIFY_GUIDE.md)
