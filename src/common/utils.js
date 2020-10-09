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


// 文章详情字段替换
const rename = (obj, key, newkey) => {
    if (Object.keys(obj).indexOf(key) !== -1) {
        obj[newkey] = obj[key]
        delete obj[key]
    }
    return obj
}

/**
 * @description 菜单排序
 * @param {*} tree 
 */
const sortMenus = (tree) => {
    tree = sortObj(tree, 'sort')
    if (tree.children && tree.children.length > 0) {
        tree.children = sortMenus(tree.children, 'sort')
    }
    if (tree.operations && tree.operations.length > 0) {
        tree.operations = sortMenus(tree.operations, 'sort')
    }
    return tree
}

/**
 * @description 封装路由结构信息
 * @param {Array} tree 菜单数据
 * @param {Array} rights 角色信息
 * @param {Boolean} flag  是否为超级管理员
 */
// 排序
const sortObj = (arr, property) => {
    return arr.sort((m, n) => m[property] - n[property])
}
const getMenuData = (tree, rights, flag) => {
    const arr = []
    for (let i = 0; i < tree.length; i++) {
        const item = tree[i]
        // _id 包含在menus中
        // 结构进行改造，删除opertaions
        if (rights.includes(item._id + '') || flag) {
            if (item.type === 'menu') {
                arr.push({
                    _id: item._id,
                    path: item.path,
                    meta: {
                        title: item.title,
                        hideInBread: item.hideInBread,
                        hideInMenu: item.hideInMenu,
                        notCache: item.notCache,
                        icon: item.icon
                    },
                    component: item.component,
                    children: getMenuData(item.children, rights)
                })
            } else if (item.type === 'link') {
                arr.push({
                    _id: item._id,
                    path: item.path,
                    meta: {
                        title: item.title,
                        icon: item.icon,
                        href: item.link
                    }
                })
            }
        }
    }

    return sortObj(arr, 'sort')
}

/**
 * @description 菜单资源中资源权限
 * @param {*} arr 
 */
const flatten = (arr) => {
    while (arr.some((item) => Array.isArray(item))) {
        arr = [].concat(...arr)
    }
    return arr
}
const getRights = (tree, menus) => {
    let arr = []
    for (let item of tree) {
        if (item.operations && item.operations.length > 0) {
            for (let op of item.operations) {
                if (menus.includes(op._id + '')) {
                    arr.push(op.path)
                }
            }
        } else if (item.children && item.children.length > 0) {
            arr.push(getRights(item.children, menus))
        }
    }
    return flatten(arr)
}

export {
    checkCode,
    getJWTpayload,
    dirExists,
    rename,
    sortMenus,
    getMenuData,
    getRights
}