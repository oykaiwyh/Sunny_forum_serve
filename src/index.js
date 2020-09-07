import koa from 'koa'
import path from 'path'
import helmet from 'koa-helmet'
import statics from 'koa-static'
import router from './routes/routes'
import koaBody from 'koa-body'
import jsonutil from 'koa-json'
import cors from '@koa/cors'
import compose from 'koa-compose'
import compress from 'koa-compress'
import Jwt from 'koa-jwt'
import config from './config/index'
import ErrorHandle from './common/ErrorHandle'
const app = new koa()

const isDevMode = process.env.NODE_ENV === 'production' ? false : true

/**
 * 定义鉴权路径
 */
const jwt = Jwt({
    secret: config.JWT_SECRET
}).unless({
    path: [/^\/public/, /^\/login/]
})

/**
 * 使用koa-compose 集成中间件
 */
const middleware = compose([
    koaBody({
        multipart: true,
        // encoding: "utf-8",
        formidable: {
            keepExtensions: true,
            maxFieldsSize: 5 * 1024 * 1024
        },
        patchKoa: true,
        onError: err => {
            console.log('koabody TCL: err', err)
        }
    }),
    statics(path.join(__dirname, '../public')),
    cors(),
    jsonutil({
        pretty: false,
        param: 'pretty'
    }),
    helmet(),
    ErrorHandle,
    jwt
])

if (!isDevMode) {
    app.use(compress())
}

app.use(middleware)
app.use(router())

app.listen(3000)