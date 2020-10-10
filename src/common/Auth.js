/**
 * @description 处理权限的中间件
 */

import {
    getJWTpayload
} from '@/common/utils'
import {
    getValue
} from '@/config/RedisConfig'
import config from '@/config/index'
import adminController from '@/api/AdminController'


export default async (ctx, next) => {
    const headers = ctx.header.authorization
    if (headers) {
        const obj = await getJWTpayload(ctx.header.authorization)
        if (obj._id) {
            ctx._id = obj._id
            const SuperAdmin = JSON.parse(await getValue('superadmin'))
            if (SuperAdmin && SuperAdmin.includes(obj._id)) {
                ctx.isAdmin = true
                await next()
                return
            } else {
                ctx.isAdmin = false
            }
        }
    }
    // 用户拥有的请求资源权限
    // 1. 过滤掉公众路径
    const {
        publicPath
    } = config
    if (publicPath.some((item) => item.test(ctx.url))) {
        await next()
        return
    }
    // 2. 根据用户的roles -> menus -> operations
    const operations = await adminController.getOperations(ctx)
    console.log(operations);
    // 3. 判断用户的请求路径是否在operations里面，如果在放行，否则禁止访问

    if (operations.includes(ctx.url)) {
        await next()
    } else {
        ctx.throw(401)
    }


    // await next()
}