import Comments from '@/model/Comments'
import Post from '@/model/Post'
import User from '@/model/user'
import CommentsHands from '@/model/CommentsHands'
import {
    checkCode,
    getJWTpayload
} from '@/common/utils'


const canReply = async (ctx) => {
    let result = false
    const obj = await getJWTpayload(ctx.header.authorization)
    if (typeof obj._id === 'undefined') {
        return result
    } else {
        const user = await User.findByID(obj._id)
        if (user.status === '0') {
            result = true
        }
        return result
    }
}

class CommentsController {
    // 获取评论列表
    async getComments(ctx) {
        const params = ctx.query
        const tid = params.tid
        const page = params.page ? params.page : 0
        const limit = params.limit ? parseInt(params.limit) : 10
        let result = await Comments.getCommentsList(tid, page, limit)
        const total = await Comments.queryCount(tid)

        // 判断用户是否登录，已登录的用户才去判断点赞信息
        let obj = {}
        if (typeof ctx.header.authorization !== 'undefined') {
            obj = await getJWTpayload(ctx.header.authorization)
        }

        if (typeof obj._id !== 'undefined') {
            result = result.map(item => item.toJSON())
            // result.forEach(async (item) => {
            //     item.handed = '0'
            //     const commentsHands = await CommentsHands.findOne({
            //         cid: item._id,
            //         uid: obj._id
            //     })
            //     if (commentsHands && commentsHands.cid) {
            //         if (commentsHands.uid === obj._id) {
            //             item.handed = '1'
            //         }
            //     }
            // });
            // for循环的效率要比forEach的高
            for (let i = 0; i < result.length; i++) {
                let item = result[i]
                item.handed = '0'
                const commentsHands = await CommentsHands.findOne({
                    cid: item._id,
                    uid: obj._id
                })
                if (commentsHands && commentsHands.cid) {
                    if (commentsHands.uid === obj._id) {
                        item.handed = '1'
                    }
                }
            }
        }

        ctx.body = {
            code: 200,
            data: result,
            total,
            msg: '评论列表查询成功'
        }

    }

    // 增加评论
    async addComment(ctx) {
        // 禁言
        const check = await canReply(ctx)
        if (!check) {
            ctx.body = {
                code: 500,
                msg: '用户已被禁言！'
            }
            return
        }

        const {
            body
        } = ctx.request
        let sid = body.sid
        let code = body.code
        //验证验证码得正确与否
        let AuthCode = await checkCode(sid, code)
        if (!AuthCode) {
            ctx.body = {
                code: 500,
                msg: '图片验证码不正确,请检查！'
            }
            return
        }

        const newComment = new Comments(body)

        const obj = await getJWTpayload(ctx.header.authorization)
        newComment.cuid = obj._id

        // 查询贴子作者，以便发送消息
        const post = await Post.findOne({
            _id: body.tid
        })
        newComment.uid = post.uid
        const comment = await newComment.save()

        const num = await Comments.getTotal(post.uid)
        global.ws.send(post.uid, JSON.stringify({
            event: 'message',
            message: num
        }))



        // 评论记数
        const updatePostanswer = await Post.updateOne({
            _id: body.tid
        }, {
            $inc: {
                answer: 1
            }
        })

        if (comment._id && updatePostanswer.ok === 1) {
            ctx.body = {
                code: 200,
                msg: '评论成功',
                data: comment
            }
        } else {
            ctx.body = {
                code: 500,
                msg: '评论失败',
            }
        }


    }

    // 更新评论
    async updateComment(ctx) {
        const check = await canReply(ctx)
        if (!check) {
            ctx.body = {
                code: 500,
                msg: '用户已被禁言！'
            }
            return
        }

        const {
            body
        } = ctx.request
        let sid = body.sid
        let code = body.code
        //验证验证码得正确与否
        let AuthCode = await checkCode(sid, code)
        if (!AuthCode) {
            ctx.body = {
                code: 500,
                msg: '图片验证码不正确,请检查！'
            }
            return
        }
        const result = await Comments.updateOne({
            _id: body.cid
        }, {
            $set: body
        })
        ctx.body = {
            code: 200,
            msg: '评论成功',
            data: result
        }

    }

    // 评论采纳
    async setBestComment(ctx) {
        // 对用户权限的判断，post uid -> header id
        const obj = await getJWTpayload(ctx.header.authorization)
        if (typeof obj === 'undefined' && obj._id !== '') {
            ctx.body = {
                code: '401',
                msg: '用户未登录，或者用户未受权'
            }
            return
        }
        const params = ctx.query

        const post = await Post.findOne({
            _id: params.tid
        })
        if (post.uid === obj._id && post.isEnd === '0') {
            // 说明这是作者本人，可以去设置isBest
            // 设置贴子结帖
            const resultEnd = await Post.updateOne({
                _id: params.tid
            }, {
                $set: {
                    isEnd: '1'
                }
            })
            // 设置最佳答案
            const resultBest = await Comments.updateOne({
                _id: params.cid
            }, {
                $set: {
                    isBest: '1'
                }
            })

            if (resultEnd.ok === 1 && resultBest.ok === 1) {
                // 把积分值给采纳的用户
                const comment = await Comments.findByCid(params.cid)
                const resultFav = await User.updateOne({
                    _id: comment.cuid
                }, {
                    $inc: {
                        favs: parseInt(post.fav)
                    }
                })
                if (resultFav.ok === 1) {
                    ctx.body = {
                        code: 200,
                        msg: '设置成功',
                        data: resultFav
                    }
                } else {
                    ctx.body = {
                        code: 500,
                        msg: '设置最佳答案-更新用户失败'
                    }
                }
            } else {
                ctx.body = {
                    code: 500,
                    msg: '设置失败',
                    data: {
                        ...resultEnd,
                        ...resultBest
                    }
                }
            }
        }

    }

    // 点赞
    async setHands(ctx) {
        const obj = await getJWTpayload(ctx.header.authorization)
        if (typeof obj === 'undefined' && obj._id !== '') {
            ctx.body = {
                code: '401',
                msg: '用户未登录，或者用户未受权'
            }
            return
        }
        const params = ctx.query


        // 判断用户是否已经点赞
        const tmp = await CommentsHands.find({
            cid: params.cid,
            uid: obj._id
        })
        if (tmp.length > 0) {
            ctx.body = {
                code: 500,
                msg: '您已经点赞，请勿重复点赞'
            }
            return
        }


        // 新增一条点赞记录
        const newHands = new CommentsHands({
            cid: params.cid,
            uid: obj._id
        })
        const data = await newHands.save()
        // 更新comments表中对应的记录的hands信息 +1
        const result = await Comments.updateOne({
            _id: params.cid
        }, {
            $inc: {
                hands: 1
            }
        })
        if (result.ok === 1) {
            ctx.body = {
                code: 200,
                msg: '点赞成功',
                data: data
            }
        } else {
            ctx.body = {
                code: 500,
                msg: '保存点赞记录失败！'
            }
        }

    }


}


export default new CommentsController()