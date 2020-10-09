import {
    SendEmail
} from '../config/MailConfig'
import moment from 'moment'
import jsonwebtoken from 'jsonwebtoken'
import config from '../config';
import {
    checkCode
} from '@/common/utils'
import User from '@/model/user'
import bcrypt from 'bcrypt'
import SignRecord from '@/model/SignRecord';


class LoginController {
    constructor() {}

    async forget(ctx) {
        const {
            body
        } = ctx.request;
        try {
            let result = await SendEmail({
                user: 'Sunny',
                code: '123',
                email: body.username,
                expire: moment().add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss')
            })
            ctx.body = {
                code: 200,
                data: result,
                msg: '邮件已经发送成功'
            }
        } catch (error) {
            console.log("Send Emaild error", error);

        }
    }

    async login(ctx) {

        // let token = jsonwebtoken.sign({
        //     _id: name,
        //     exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 过期时间1天
        // }, config.JWT_SECRET)

        const {
            body
        } = ctx.request
        let sid = body.sid
        let code = body.code

        // console.log(body.name);

        //验证验证码得正确与否
        let AuthCode = await checkCode(sid, code)
        if (AuthCode) {
            let Auth = false
            let user = await User.findOne({
                username: body.username
            })
            if (!user) {
                ctx.body = {
                    code: 404,
                    msg: '用户不存在'
                }
            }
            // // 静态方法去过滤
            // let findstatic = await User.findByName(body.username)
            let userObj = user.toJSON() //mongoose提供方法只取数据
            const arr = ['password', 'username']
            arr.map(item => {
                delete userObj[item]
            })

            if (user != null && await bcrypt.compare(body.password, user.password)) {
                Auth = true
            }

            if (Auth) {
                let token = jsonwebtoken.sign({
                    _id: userObj._id,
                }, config.JWT_SECRET, {
                    expiresIn: '1d' //1天
                })
                //加入签到属性
                const signRecord = await SignRecord.findByUid(userObj._id)
                // console.log(signRecord);

                if (signRecord !== null) {
                    if (moment(signRecord.created).format('YYYY-MM-DD') ===
                        moment().format('YYYY-MM-DD')
                    ) {
                        userObj.isSign = true
                    } else {
                        userObj.isSign = false
                    }
                    userObj.lastSign = signRecord.created

                }

                ctx.body = {
                    code: 200,
                    // data: {
                    //     ...findstatic
                    // },
                    data: {
                        // ...user   直接扩展user存放的数据会在_doc里，但是mongoose可以通过toJSON直接取到数据
                        ...userObj
                    },
                    token: token
                }
            } else {
                ctx.body = {
                    code: 404,
                    msg: '用户名，密码错误，请检查'
                }
            }
        } else {
            ctx.body = {
                code: 401,
                msg: '图片验证码不正确，请检查'
            }
        }



    }
    async register(ctx) {

        // let token = jsonwebtoken.sign({
        //     _id: name,
        //     exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 过期时间1天
        // }, config.JWT_SECRET)

        const {
            body
        } = ctx.request
        let sid = body.sid
        let code = body.code
        //验证验证码得正确与否
        let AuthCode = await checkCode(sid, code)
        let noAuth = true
        let msg = {}

        if (AuthCode) {
            let isUsername = await User.findOne({
                username: body.username
            })
            console.log(isUsername);

            let isname = await User.findOne({
                name: body.name
            })
            if (isUsername !== null && typeof isUsername !== 'undefined') {
                msg.username = ['邮箱已经被注册,请重新填写新邮箱！']
                noAuth = false
            }
            if (isname !== null && typeof isname !== 'undefined') {
                msg.name = ['昵称已经被注册,请重写！']
                noAuth = false
            }

            if (noAuth) {

                body.password = await bcrypt.hash(body.password, 5)

                let newuser = new User({
                    username: body.username,
                    name: body.name,
                    password: body.password,
                    created: moment().format('YYYY-MM-DD HH:mm:ss')
                })
                let result = await newuser.save()
                ctx.body = {
                    code: 200,
                    data: result,
                    msg: "用户注册成功"
                }
                return
            }

        } else {
            msg.code = ['图片验证码已失效，请重新获取']
        }

        ctx.body = {
            code: 500,
            msg
        }



    }

}


export default new LoginController()