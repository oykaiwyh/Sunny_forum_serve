import log4js from '@/config/log4'
import ErrorRecord from '@/model/ErrorRecord'


const logger = log4js.getLogger('error')
export default (ctx, next) => {
    return next().catch((err) => {
        // 自定义的日志记录信息
        logger.error(`${ctx.url} ${ctx.method} ${ctx.status} ${err.stack} `)

        if (401 == err.status) {
            ctx.status = 401;
            ctx.body = {
                code: 401,
                msg: 'Protected resource, use Authorization header to get access\n'
            }
        } else {
            // throw err; //错误信息存储再stack里
            ctx.status = err.status || 500
            ctx.body = Object.assign({
                code: 500,
                msg: err.message
            }, process.env.NODE_ENV === 'development' ? {
                stack: err.stack
            } : {})
        }
    });
}