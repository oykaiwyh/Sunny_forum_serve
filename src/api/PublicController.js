import svgCaptcha from 'svg-captcha';
// import {
//     getValue,
//     setValue,
// } from '../config/RedisConfig'
/**
 * 需要通过webpack转移
 * webpack 添加配置 watch npm run watch 启动实时监听文件，实时打包
 * 添加 debug 配置使用nodemon运行webpack打包后的文件  npm run debug 启动
 */
import {
    getValue,
    setValue,
} from '@/config/RedisConfig'

class PublicController {
    constructor() {}
    async getCaptcha(ctx) {
        const body = ctx.request.query
        var captcha = svgCaptcha.create({
            size: 4,
            ignoreChars: 'o0li1', //过滤出现o0这样的干扰
            color: true,
            noise: Math.floor(Math.random() * 5),
            width: 150,
            height: 38
        });
        // console.log(captcha);
        // 保存图片验证码数据 ， 设置超时时间 ，单位：秒
        setValue(body.sid, captcha.text, 10 * 60)
        // getValue(body.sid).then(res => {
        //     console.log(res);
        // })
        ctx.body = {
            code: 200,
            data: captcha.data,
        }
    }
}

export default new PublicController()