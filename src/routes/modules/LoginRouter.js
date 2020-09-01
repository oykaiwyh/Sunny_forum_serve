import Router from 'koa-router'

import LoginController from '../../api/LoginController'

const router = new Router()

router.post('/reset', LoginController.reset)
router.post('/login', LoginController.login)
router.post('/register', LoginController.register)

export default router