import SignRecord from '../model/SignRecord'
import {
    getJWTpayload
} from '../common/utils'
import User from '../model/user'
import moment from 'dayjs'
import {
    SendEmail
} from '../config/MailConfig'
import uuid from 'uuid/dist/v4'
import jwt from 'jsonwebtoken'
import config from '@/config';
import {
    getValue,
    setValue
} from '@/config/RedisConfig'
import bcrypt from 'bcrypt' //版本要求较高
import UserCollect from '@/model/UserCollect'
import Comments from '@/model/Comments'

class UserController {
    //用户签到接口
    async userSign(ctx) {
        //获取用户id
        const obj = await getJWTpayload(ctx.header.authorization)

        //查询用户上一次签到记录
        let user = await User.findByID(obj._id)
        const record = await SignRecord.findByUid(obj._id)
        let result = {}
        let newRecord = {}
        // 签到逻辑
        if (record !== null) {
            //有历史的签到记录
            // 有历史的签到数据
            // 判断用户上一次签到记录的created时间是否与今天相同
            // 如果当前时间的日期与用户上一次的签到日期相同，说明用户已经签到
            if (moment(record.created).format('YYYY-MM-DD') ===
                moment().format('YYYY-MM-DD')
            ) {
                ctx.body = {
                    code: 500,
                    favs: user.favs,
                    count: user.count,
                    lastSign: record.created,
                    msg: '用户已经签到'
                }
                return
            } else {
                // 有上一次的签到记录，并且不与今天相同，进行连续签到的判断
                // 如果相同，代表用户是在连续签到
                let count = user.count
                let fav = 0
                // 判断签到时间 用户上一次的签到时间等于，当前时间的前一天，说明，用户在连续签到
                // 第n+1天签到的时候，需要与第n的天created比较
                if (moment(record.created).format('YYYY-MM-DD') === moment().subtract(1, 'days').format('YYYY-MM-DD')) {
                    count += 1
                    if (count < 5) {
                        fav = 5
                    } else if (count >= 5 && count < 15) {
                        fav = 10
                    } else if (count >= 15 && count < 30) {
                        fav = 15
                    } else if (count >= 30 && count < 100) {
                        fav = 20
                    } else if (count >= 100 && count < 365) {
                        fav = 30
                    } else if (count >= 365) {
                        fav = 50
                    }
                    await User.updateOne({
                        _id: obj._id
                    }, {
                        // user.favs += fav
                        // user.count += 1
                        $inc: {
                            favs: fav,
                            count: 1
                        }
                    })
                    result = {
                        favs: user.favs + fav,
                        count: user.count + 1
                    }
                } else {
                    //用户中断了签到
                    fav = 5
                    await User.updateOne({
                        _id: obj._id
                    }, {
                        $set: {
                            count: 1
                        },
                        $inc: {
                            favs: fav
                        }
                    })
                    result = {
                        favs: user.favs + fav,
                        count: 1
                    }
                }
                //更新签到记录
                newRecord = new SignRecord({
                    uid: obj._id,
                    favs: 5,
                    // lastSign: record.created
                })
                await newRecord.save()
            }
        } else {
            //无签到数据
            //保存用户的签到记录 ， 签到计数 、 积分数据
            await User.updateOne({
                _id: obj._id
            }, {
                $set: {
                    count: 1
                }, // set 设置
                $inc: {
                    favs: 5
                }, //increas增加
            })
            newRecord = new SignRecord({
                uid: obj._id,
                favs: 5,
                // lastSign: moment().format('YYYY-MM-DD HH:mm:ss')
            })
            newRecord.save()
            result = {
                favs: user.favs + 5,
                count: 1
            }
        }
        ctx.body = {
            code: 200,
            msg: '签到请求成功',
            ...result,
            lastSign: newRecord.created
        }
    }

    //更新用户基本信息接口
    async updateUserInfo(ctx) {
        const {
            body
        } = ctx.request
        let msg = ''
        const obj = await getJWTpayload(ctx.header.authorization)
        //判断用户是否修改了邮箱
        const user = await User.findOne({
            _id: obj._id
        })
        if (body.username && body.username !== user.username) {
            //用户修改了邮箱
            // 发送reset邮件
            //判断用户得新邮箱是否已经有人注册

            const OwnUser = await User.findOne({
                username: body.username
            })
            if (OwnUser && OwnUser.password) {
                ctx.body = {
                    code: 501,
                    msg: "邮箱已经注册"
                }
                return
            }

            const key = uuid()
            setValue(
                key,
                jwt.sign({
                    _id: obj._id
                }, config.JWT_SECRET, {
                    expiresIn: '30m'
                })
            )
            const result = await SendEmail({
                type: 'email',
                user: user.name,
                code: '',
                email: user.username,
                expire: moment().add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
                data: {
                    key: key,
                    username: body.username
                }
            })

            // ctx.body = {
            //     code: 200,
            //     msg: '已成功发送验证邮箱，请点击链接确认修改邮箱账号'
            // }
            msg = '更新基本资料成功，账号修改需要邮件验证，已成功发送验证邮箱，请查收'

        }
        //修改了其它信息
        const ellipsis_data = ['username', 'mobile', 'password']
        ellipsis_data.map(item => {
            delete body[item]
        })
        const result = await User.updateOne({
            _id: obj._id
        }, body)
        if (result.n === 1 && result.ok === 1) {
            ctx.body = {
                code: 200,
                msg: msg === '' ? '用户信息更新成功' : msg
            }
        } else {
            ctx.body = {
                code: 500,
                msg: '用户信息更新失败'
            }
        }
    }

    //更新用户名
    async updateUsername(ctx) {
        const body = ctx.query
        if (body.key) {
            const token = await getValue(body.key)
            const obj = getJWTpayload('Bearer ' + token)

            await User.updateOne({
                _id: obj._id
            }, {
                username: body.username
            })
            ctx.body = {
                code: 200,
                msg: '更新用户名成功'
            }
        }
    }

    // 修改密码
    async changePasswd(ctx) {
        const {
            body
        } = ctx.request
        const obj = await getJWTpayload(ctx.header.authorization)
        const user = await User.findOne({
            _id: obj._id
        })
        // 密码比较比较 前面是未加密的值 ， 后面是加密的hash
        if (await bcrypt.compare(body.oldpwd, user.password)) {
            const newpasswd = await bcrypt.hash(body.newpwd, 5)
            const result = await User.updateOne({
                _id: obj._id
            }, {
                $set: {
                    password: newpasswd
                }
            })
            ctx.body = {
                code: 200,
                msg: '更新密码成功'
            }
        } else {
            ctx.body = {
                code: 500,
                msg: '更新密码错误，请检查当前密码是否输入正确？'
            }
        }



    }

    // 设置 / 取消收藏 
    async setCollect(ctx) {
        const params = ctx.query
        const obj = await getJWTpayload(ctx.header.authorization)

        if (parseInt(params.isFav)) {
            // 说明用户已经收藏了贴子
            await UserCollect.deleteOne({
                uid: obj._id,
                tid: params.tid
            })
            ctx.body = {
                code: 200,
                msg: '取消收藏成功'
            }
        } else {
            const newCollect = new UserCollect({
                uid: obj._id,
                tid: params.tid,
                title: params.title
            })

            const result = await newCollect.save()
            if (result.uid) {
                ctx.body = {
                    code: 200,
                    data: result,
                    msg: '设置收藏成功'
                }
            }
        }

    }

    // 获取收藏列表
    async getCollectByUid(ctx) {
        const params = ctx.query
        const obj = await getJWTpayload(ctx.header.authorization)
        const result = await UserCollect.getListByUid(
            obj._id,
            params.page,
            params.limit ? parseInt(params.limit) : 10
        )
        const total = await UserCollect.countByUid(obj._id)
        if (result.length > 0) {
            ctx.body = {
                code: 200,
                data: result,
                total,
                msg: '查询列表成功'
            }
        } else {
            ctx.body = {
                code: 500,
                msg: '无收藏贴子'
            }
        }
    }

    // 获取用户的基本信息
    async getBasicInfo(ctx) {
        const params = ctx.query
        // const obj = await getJWTPayload(ctx.header.authorization)
        const uid = params.uid || ctx._id
        let user = await User.findByID(uid)
        // 取得用户的签到记录 有没有 > today 0:00:00
        user = user.toJSON()
        const date = moment().format('YYYY-MM-DD')
        const result = await SignRecord.findOne({
            uid: uid,
            created: {
                $gte: date + ' 00:00:00'
            }
        })
        if (result && result.uid) {
            user.isSign = true
        } else {
            user.isSign = false
        }
        ctx.body = {
            code: 200,
            data: user,
            msg: '查询成功！'
        }
    }

    // 获取用户的历史消息
    // 记录评论之后，给作者发送消息
    async getMsg(ctx) {
        const params = ctx.query
        const page = params.page ? params.page : 0
        const limit = params.limit ? parseInt(params.limit) : 0
        // 方法一： 嵌套查询 -> aggregate 12-4-2
        // 方法二： 通过冗余换时间
        const obj = await getJWTpayload(ctx.header.authorization)

        const num = await Comments.getTotal(obj._id)
        const result = await Comments.getMsgList(obj._id, page, limit)
        // console.log(result);

        ctx.body = {
            code: 200,
            data: result,
            total: num
        }

    }

    // 设置已读消息
    async setMsg(ctx) {
        const params = ctx.query
        if (params.id) { // 指定消息
            const result = await Comments.updateOne({
                _id: params.id
            }, {
                isRead: '1'
            })
            if (result.ok === 1) {
                ctx.body = {
                    code: 200,
                }
            }
        } else { // 所有消息
            const obj = await getJWTpayload(ctx.header.authorization)
            const result = await Comments.updateMany({
                uid: obj.id
            }, {
                isRead: '1'
            })
            if (result.ok === 1) {
                ctx.body = {
                    code: 200,
                }
            }
        }

    }





}

export default new UserController()