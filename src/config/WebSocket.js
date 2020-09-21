/**
 * 简易的实现了心跳监测等
 * npm install --save reconnecting-websocket 这个对webscoket进行了封装，心跳监测也有对应的封装
 * 
 */

import WebSocket from 'ws'
import {
    getJWTpayload
} from '@/common/utils'
import Comments from '@/model/Comments'


class WebSocketServer {
    constructor(config = {}) {
        const defaultConfig = {
            port: 3001, // 端口
            timeInterval: 3 * 1000, //心跳监测间隔
            isAuth: true // 鉴权
        }
        // 最终配置
        const finalConfig = {
            ...defaultConfig,
            ...config
        }
        this.wss = {} // 所有的客户端
        this.timeInterval = finalConfig.timeInterval
        this.isAuth = finalConfig.isAuth
        this.port = finalConfig.port
        this.options = config.options || {} // 一些其它的官方配置
        this.Timer = null // 一些其它的官方配置
    }
    // 初始化websocket服务
    init() {
        this.wss = new WebSocket.Server({
            port: this.port,
            ...this.options
        })

        // 心跳监测
        this.heartbeat()

        // 客户端连接
        this.wss.on('connection', (ws) => {
            ws.isAlive = true // 心跳开启

            ws.send(JSON.stringify({
                event: 'heartbeat',
                message: 'ping'
            }))

            // 监听客户端发送消息
            ws.on('message', (msg) => {
                this.onMessage(ws, msg)
            })

            // 客户端断开连接
            ws.on('close', () => this.onClose(ws))

        })
    }
    // 客户端消息处理
    onMessage(ws, msg) {
        // 用户鉴权 -> token -> _id
        // 心跳监测
        // 消息发送
        const msgObj = JSON.parse(msg)
        const events = {
            auth: async () => {
                try {
                    const obj = await getJWTpayload(msgObj.message)
                    if (obj) {
                        ws.isAuth = true
                        ws._id = obj._id

                        const num = await Comments.getTotal(obj._id) //获取未读消息数
                        ws.send(JSON.stringify({
                            event: 'message',
                            // message: 'auth is OK'
                            message: num
                        }))
                    }
                } catch (error) {
                    ws.send(JSON.stringify({
                        event: 'noauth',
                        message: 'please auth again'
                    }))
                }
                // const obj = await getJWTpayload(msgObj.message)
                // if (obj) {
                //     ws.isAuth = true
                //     ws._id = obj._id
                //     ws.send('auth ok!')
                // } else {
                //     ws.send(JSON.stringify({
                //         event: 'noauth',
                //         message: 'please auth again'
                //     }))
                // }
            },
            heartbeat: () => {
                if (msgObj.message === 'pong') {
                    ws.isAlive = true
                }
            },
            message: () => {
                // 鉴权拦截
                if (!ws.isAuth && this.isAuth) {
                    return
                }
                // 消息广播
                this.wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN && client._id === ws._id) {
                        client.send(msg)
                    }
                })
            }
        }
        events[msgObj.event]()
    }
    // 点对点消息发送
    send(uid, msg) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client._id === uid) {
                client.send(msg)
            }
        })
    }
    // 广播消息发送 -> 推送系统消息
    broadcast(uid, msg) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg)
            }
        })
    }

    // 心跳监测
    heartbeat() {

        clearInterval(this.Timer)
        this.Timer = setInterval(() => {
            this.wss.clients.forEach(ws => {
                // 主动发送心跳监测请求
                // 当客户端返回了消息之后，主动设置flag为在线
                if (!ws.isAlive) {
                    return ws.terminate()
                }
                ws.isAlive = false
                ws.send(JSON.stringify({
                    event: 'heartbeat',
                    message: 'ping',
                }))

            })
        }, this.timeInterval)
    }

    // 客户端关闭处理
    onClose(ws) {

    }


}


export default WebSocketServer