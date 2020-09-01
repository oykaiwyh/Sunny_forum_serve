const DB_URL = 'mongodb://admin:admin@192.168.10.133/Sunny_forum'

const REDIS = {
    host: "192.168.10.133",
    port: 6379,
    password: 'root'
}

/**
 * 对于SECRET 可以选择以 mongodb 用户id + slat (盐) 再用 md5 等方式加密 最终形成一个密钥 md5(id+slat)
 */
const JWT_SECRET = 'Sunny-forum-secret'



export default {
    DB_URL,
    REDIS,
    JWT_SECRET
}