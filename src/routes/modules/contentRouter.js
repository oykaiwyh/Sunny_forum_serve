import Router from 'koa-router'

import contentController from '@/api/ContentController'

const router = new Router()
router.prefix('/content')

//上传图片
router.post('/upload', contentController.uploadImg)

//发表新帖
router.post('/add', contentController.addPost)

//更新帖子
router.post('/update', contentController.updatePost)

// 后台管理---删除贴子
router.get('/delete', contentController.deletePost)
// 后台管理---更新贴子
router.post('/update-id', contentController.updatePost)


export default router