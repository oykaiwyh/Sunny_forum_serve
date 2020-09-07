import Router from 'koa-router'
import PublicController from '../../api/PublicController'
import contentController from '@/api/ContentController'
import userController from '@/api/UserController'

const router = new Router()
router.prefix('/public')

router.get('/getcaptcha', PublicController.getCaptcha)

// 获取文章列表
router.get('/list', contentController.getPostList)

// 温馨提醒
router.get('/tips', contentController.getTips)

// 友情链接
router.get('/links', contentController.getLinks)

// 回复周榜
router.get('/topWeek', contentController.getTopWeek)

// 确认修改邮件
router.get('/resetEmail', userController.updateUsername)

// 获取文章详情
router.get('/content/detail', contentController.getPostDetail)

export default router