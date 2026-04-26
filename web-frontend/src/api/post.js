import request from '@/utils/request'

// 获取分类列表
export function getCategories() {
  return request.get('/posts/categories')
}

// 获取帖子列表
export function getPostList(params) {
  return request.get('/posts', { params })
}

// 获取帖子详情
export function getPostDetail(id) {
  return request.get(`/posts/${id}`)
}

// 获取推荐列表（智能匹配）
export function getRecommendations(id) {
  return request.get(`/posts/${id}/recommendations`)
}

// 智能搜索（增强版）
export function smartSearch(params) {
  return request.get('/posts/search/smart', { params })
}

// 发布帖子
export function createPost(data) {
  return request.post('/posts', data)
}

// 更新帖子
export function updatePost(id, data) {
  return request.put(`/posts/${id}`, data)
}

// 提交审核
export function submitPost(id) {
  return request.post(`/posts/${id}/submit`)
}

// 删除帖子
export function deletePost(id) {
  return request.delete(`/posts/${id}`)
}

// 获取我的发布
export function getMyPosts() {
  return request.get('/posts/mine/list')
}

// 发起认领申请
export function createClaim(data) {
  return request.post('/claims', data)
}

// 获取我的认领
export function getMyClaims() {
  return request.get('/claims/my')
}

// 撤销认领申请
export function cancelClaim(id) {
  return request.post(`/claims/${id}/cancel`)
}
