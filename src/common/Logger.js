// 中间件 日志记录
import log4js from '@/config/log4'
const logger = log4js.getLogger('application')


export default async (ctx, next) => {
    const start = Date.now()
    await next()
    const resTime = Date.now() - start
    // logger.warn(`测试数据 [${ctx.method}] - ${ctx.url} - time: ${resTime / 1000}s`)
    if (resTime / 1000 > 1) {
        // 主要判断系统执行效率
        logger.warn(`[${ctx.method}] - ${ctx.url} - time: ${resTime / 1000}s`)
    }
}