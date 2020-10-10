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
import WebScoketServe from './config/WebSocket'
import ErrorHandle from './common/ErrorHandle'
import Auth from '@/common/Auth'
import {
    run
} from '@/common/init'

// import logger from 'koa-logger'

import log4js from '@/config/log4'
import Logger from '@/common/Logger'



const app = new koa()

// 实例化websocket
const ws = new WebScoketServe()
ws.init()
global.ws = ws

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
    Logger,
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
    jwt,
    Auth,
    // logger(),只有记录请求正确的url信息，错误的不能去搜集 简洁
    // 对于logger去写入文件，是会去影响性能的
    isDevMode ? log4js.koaLogger(log4js.getLogger('http'), {
        level: 'auto'
    }) : log4js.koaLogger(log4js.getLogger('access'), {
        level: 'auto'
    }),
])

if (!isDevMode) {
    app.use(compress())
}

app.use(middleware)
app.use(router())

app.listen(3000, () => {
    // console.log('app is running 3000');
    run()
})