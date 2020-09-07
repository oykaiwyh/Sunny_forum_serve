import {
    getValue,
} from '@/config/RedisConfig'
import config from '../config/index'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

//获取token的payload
const getJWTpayload = token => {
    // console.log(token);
    return jwt.verify(token.split(' ')[1], config.JWT_SECRET)
}

//验证码的验证
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

//验证文件是否存在 ，node自身fs库提供判断的方法
// https://nodejs.org/docs/latest-v10.x/api/fs.html#fs_class_fs_stats
const dirExists = async (dir) => {
    // 路径的判断
    const isExists = await getStats(dir)
    console.log('isExists', isExists);

    //如果该路径存在且不是文件，返回true
    if (isExists && isExists.isDirectory()) {
        return true
    } else if (isExists) {
        // 路径存在，但是是false
        return false
    }
    //如果该路径不存在
    const tempDir = path.parse(dir).dir
    console.log('tempDir', tempDir);

    // 循环遍历，递归判断如果上级目录不存在，则产生上级目录
    const status = await dirExists(tempDir)
    console.log('testatusmpDir', status);

    if (status) {
        const result = await mkdir(dir)
        console.log('result', result);
        return result
    } else {
        return false
    }
}
const getStats = async (path) => {
    return new Promise(resolve => {
        // fs.stats(path, (err, stats) => {
        //     if (err) {
        //         resolve(err)
        //     } else {
        //         resolve(stats)
        //     }
        // })
        fs.stat(path, (err, stats) => err ? resolve(false) : resolve(stats))
    })
}
const mkdir = async (dir) => {
    return new Promise(resolve => {
        fs.mkdir(dir, err => err ? resolve(false) : resolve(true))
    })
}




export {
    checkCode,
    getJWTpayload,
    dirExists
}