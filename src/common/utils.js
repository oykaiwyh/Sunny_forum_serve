import {
    getValue,
} from '@/config/RedisConfig'
import config from '../config/index'
import jwt from 'jsonwebtoken'

const getJWTpayload = token => {
    // console.log(token);
    return jwt.verify(token.split(' ')[1], config.JWT_SECRET)
}

const checkCode = async (key, value) => {
    const redisData = await getValue(key)
    if (redisData != null) {
        if (redisData.toLowerCase() === value.toLowerCase()) { //转换小写，排除大小写得影响
            return true
        } else {
            return false
        }
    } else {
        return false
    }
}


export {
    checkCode,
    getJWTpayload
}