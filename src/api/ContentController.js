import Post from '../model/Post'
import Links from '../model/Links'
import fs from 'fs'
import uuid from 'uuid/dist/v4'
import moment from 'dayjs'
import config from '@/config'
import mkdir from 'make-dir'
import {
    checkCode,
    getJWTpayload,
    dirExists,
    rename
} from '@/common/utils'
import User from '@/model/user'
import PostTags from '@/model/PostTags'
import UserCollect from '../model/UserCollect'
import qs from 'qs'

class ContentController {
    // 获取文章列表
    async getPostList(ctx) {
        const body = qs.parse(ctx.query)

        const sort = body.sort ? body.sort : 'created'
        const page = body.page ? parseInt(body.page) : 0
        const limit = body.limit ? parseInt(body.limit) : 20
        const options = {}

        if (body.title) {
            options.title = {
                $regex: body.title
            }
        }
        if (body.catalog && body.catalog.length > 0) {
            options.catalog = {
                $in: body.catalog
            }
        }
        if (body.isTop) {
            options.isTop = body.isTop
        }
        if (body.isEnd) {
            options.isEnd = body.isEnd
        }
        if (body.status) {
            options.status = body.status
        }
        if (typeof body.tag !== 'undefined' && body.tag !== '') {
            options.tags = {
                $elemMatch: {
                    name: body.tag
                }
            }
        }
        const result = await Post.getList(options, sort, page, limit)
        const total = await Post.countList(options)

        ctx.body = {
            code: 200,
            data: result,
            msg: '获取文章列表成功',
            total: total
        }
    }

    // 查询友链
    async getLinks(ctx) {
        const result = await Links.find({
            type: 'links'
        })
        ctx.body = {
            code: 200,
            data: result
        }
    }

    // 查询温馨提醒
    async getTips(ctx) {
        const result = await Links.find({
            type: 'tips'
        })
        ctx.body = {
            code: 200,
            data: result
        }
    }

    // 本周热议
    async getTopWeek(ctx) {
        const result = await Post.getTopWeek()
        ctx.body = {
            code: 200,
            data: result
        }
    }

    // 上传图片
    async uploadImg(ctx) {
        const file = ctx.request.files.file

        // 图片名称、图片格式、存储的位置、返回前台可读取的路径
        const ext = file.name.split('.').pop()
        // const dir = `../../public/${moment().format('YYYYMMDD')}`
        const dir = `${config.uploadPath}/${moment().format('YYYYMMDD')}`

        //判断路径是否存在，不存在则创建
        // 方法一
        // await dirExists(dir)
        //方法二
        await mkdir(dir)

        //存储文件到指定的路径
        const picname = uuid()
        const SavePath = `${dir}/${picname}.${ext}`
        const readStream = fs.createReadStream(file.path, {
            highWaterMark: 64 * 1024 //默认64k
        })
        const upStream = fs.createWriteStream(SavePath)
        const filePath = `/${moment().format('YYYYMMDD')}/${picname}.${ext}`
        // 方法一
        // readStream.pipe(upStream)
        //方法二 应对大型文件，对其上传进度、过程等进行监听
        const stat = fs.statSync(file.path)
        // console.log('stat', stat.size);
        let totalLength = 0 //分块数据
        //读取数据的监听
        readStream.on('data', function (chunk) {
            // chunk 每次发送的区块数据
            totalLength += chunk.length
            if (upStream.write(chunk) === false) {
                readStream.pause()
            }
        })
        //缓存区充满并被写入完成，处于清空状态时触发
        readStream.on('drain', () => {
            console.log('readStream drain');
            readStream.resume() //继续读取
        })
        // 读取结束
        readStream.on('end', () => {
            console.log('readStream end');
            upStream.end() //关闭写入流
        })
        // 读取发生错误
        readStream.on('error', () => {
            console.log('readStream error');
        })

        ctx.body = {
            code: 200,
            msg: "图片上传成功",
            data: filePath
        }
    }

    // 添加新帖
    async addPost(ctx) {
        const {
            body
        } = ctx.request
        const sid = body.sid
        const code = body.code
        // 验证图片验证码的时效性、正确性
        const result = await checkCode(sid, code)
        if (result) {
            const obj = await getJWTpayload(ctx.header.authorization)
            // 判断用户的积分数是否 > fav，否则，提示用户积分不足发贴
            // 用户积分足够的时候，新建Post，减除用户对应的积分
            const user = await User.findByID({
                _id: obj._id
            })
            if (user.favs < body.fav) {
                ctx.body = {
                    code: 501,
                    msg: '积分不足'
                }
                return
            } else {
                await User.updateOne({
                    _id: obj._id
                }, {
                    $inc: {
                        favs: -body.fav
                    }
                })
            }
            const newPost = new Post(body)
            newPost.uid = obj._id
            const result = await newPost.save()
            ctx.body = {
                code: 200,
                msg: '成功的保存的文章',
                data: result
            }
        } else {
            // 图片验证码验证失败
            ctx.body = {
                code: 500,
                msg: '图片验证码验证失败'
            }
        }
    }

    // 更新帖子
    async updatePost(ctx) {
        const {
            body
        } = ctx.request
        const sid = body.sid
        const code = body.code
        // 验证图片验证码的时效性、正确性
        const result = await checkCode(sid, code)
        if (result) {
            const obj = await getJWTpayload(ctx.header.authorization)
            // 判断帖子作者是否为本人
            const post = await Post.findOne({
                _id: body.tid
            })

            if (post.uid === obj._id && post.isEnd === '0') {
                await ContentController.prototype.updatePost(ctx)

                // const result = await Post.updateOne({
                //     _id: body.tid
                // }, body)
                // if (result.ok === 1) {
                //     ctx.body = {
                //         code: 200,
                //         data: result,
                //         msg: '更新帖子成功'
                //     }
                // } else {
                //     ctx.body = {
                //         code: 500,
                //         data: result,
                //         msg: '编辑帖子，更新失败'
                //     }
                // }
            } else {

                ctx.body = {
                    code: 401,
                    msg: '没有操作的权限/贴子已结帖',
                }
            }

        } else {
            // 图片验证码验证失败
            ctx.body = {
                code: 500,
                msg: '图片验证码验证失败'
            }
        }
    }

    // 获取文章详情
    async getPostDetail(ctx) {
        const params = ctx.query
        if (!params.tid) {
            ctx.body = {
                code: 500,
                msg: '文章id为空'
            }
            return
        }
        const post = await Post.findByTid({
            _id: params.tid
        })

        let isFav = 0
        // 判断用户是否传递Authorization的数据，即是否登录
        if (
            typeof ctx.header.authorization !== 'undefined' &&
            ctx.header.authorization !== ''
        ) {
            const obj = await getJWTpayload(ctx.header.authorization)
            const userCollect = await UserCollect.findOne({
                uid: obj._id,
                tid: params.tid
            })
            if (userCollect && userCollect.tid) {
                isFav = 1
            }
        }
        const newPost = post.toJSON()
        newPost.isFav = isFav

        // 更新文章阅读记数
        const result = await Post.updateOne({
            _id: params.tid
        }, {
            $inc: {
                reads: 1
            }
        })
        // const result = rename(post.toJSON(), 'uid', 'user')
        if (post._id && result.ok === 1) {

            ctx.body = {
                code: 200,
                data: newPost,
                msg: '查询文章详情成功'
            }

        } else {
            ctx.body = {
                code: 500,
                msg: '获取文章详情失败'
            }
        }

    }

    // 获取用户发帖记录
    async getPostByUid(ctx) {
        const params = ctx.query
        const obj = await getJWTpayload(ctx.header.authorization)

        const result = await Post.getListByUid(
            // params.uid,
            obj._id,
            params.page,
            params.limit ? parseInt(params.limit) : 10
        )
        const total = await Post.countByUid(obj._id)

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
                msg: '无发表贴'
            }
        }

    }
    // 获取用户发贴记录
    async getPostPublic(ctx) {
        const params = ctx.query
        const result = await Post.getListByUid(
            params.uid,
            params.page,
            params.limit ? parseInt(params.limit) : 10
        )
        const total = await Post.countByUid(params.uid)
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
                msg: '查询列表失败'
            }
        }
    }

    // 删除贴子
    async deletePostByUid(ctx) {
        const params = ctx.query
        const obj = await getJWTpayload(ctx.header.authorization)

        const post = await Post.findOne({
            uid: obj._id,
            _id: params.tid
        })
        if (post.id === params.tid && post.isEnd === '0') {
            // 不能直接使用this,因为此时导出的是一个new ContentController()的实例,this是拿不到方法的
            // console.log(this);
            // await this.deletePost(ctx)

            await ContentController.prototype.deletePost(ctx)

            // const result = await Post.deleteOne({
            //     _id: params.tid
            // })
            // if (result.ok === 1) {
            //     ctx.body = {
            //         code: 200,
            //         data: result,
            //         msg: '删除贴子成功'
            //     }
            // } else {
            //     ctx.body = {
            //         code: 500,
            //         msg: '删除贴子失败'
            //     }
            // }
        } else {
            ctx.body = {
                code: 401,
                msg: '无权限删除贴子'
            }
        }



    }

    // 后台管理---删除贴子
    async deletePost(ctx) {
        const params = ctx.query

        const result = await Post.deleteOne({
            _id: params.tid
        })
        if (result.ok === 1) {
            ctx.body = {
                code: 200,
                data: result,
                msg: '删除贴子成功'
            }
        } else {
            ctx.body = {
                code: 500,
                msg: '删除贴子失败'
            }
        }
    }

    // 后台管理---更新贴子
    async updatePost(ctx) {
        const {
            body
        } = ctx.request

        const result = await Post.updateOne({
            _id: body._id
        }, body)
        if (result.ok === 1) {
            ctx.body = {
                code: 200,
                data: result,
                msg: '更新帖子成功'
            }
        } else {
            ctx.body = {
                code: 500,
                data: result,
                msg: '编辑帖子，更新失败'
            }
        }
    }

    // 后台---添加标签
    async addTag(ctx) {
        const {
            body
        } = ctx.request
        const tag = new PostTags(body)
        await tag.save()
        ctx.body = {
            code: 200,
            msg: '标签保存成功'
        }
    }

    // 后台---添加标签
    async getTags(ctx) {
        const params = ctx.query
        const page = params.page ? parseInt(params.page) : 0
        const limit = params.limit ? parseInt(params.limit) : 10
        const result = await PostTags.getList({}, page, limit)
        const total = await PostTags.countList({})
        ctx.body = {
            code: 200,
            data: result,
            total,
            msg: '查询tags成功！'
        }
    }

    // 后台---删除标签
    async removeTag(ctx) {
        const params = ctx.query
        const result = await PostTags.deleteOne({
            id: params.ptid
        })

        ctx.body = {
            code: 200,
            data: result,
            msg: '删除成功'
        }
    }

    // 后台---更新标签
    async updateTag(ctx) {
        const {
            body
        } = ctx.request
        const result = await PostTags.updateOne({
                _id: body._id
            },
            body
        )

        ctx.body = {
            code: 200,
            data: result,
            msg: '更新成功'
        }
    }

    // // 更新帖子
    // async updatePost(ctx) {
    //     const {
    //         body
    //     } = ctx.request
    //     const sid = body.sid
    //     const code = body.code
    //     // 验证图片验证码的时效性、正确性
    //     const result = await checkCode(sid, code)
    //     if (result) {
    //         const obj = await getJWTpayload(ctx.header.authorization)
    //         // 判断帖子作者是否为本人
    //         const post = await Post.findOne({
    //             _id: body.tid
    //         })
    //         // 判断帖子是否结贴
    //         if (post.uid === obj._id && post.isEnd === '0') {
    //             const result = await Post.updateOne({
    //                 _id: body.tid
    //             }, body)
    //             if (result.ok === 1) {
    //                 ctx.body = {
    //                     code: 200,
    //                     data: result,
    //                     msg: '更新帖子成功'
    //                 }
    //             } else {
    //                 ctx.body = {
    //                     code: 500,
    //                     data: result,
    //                     msg: '编辑帖子，更新失败'
    //                 }
    //             }
    //         } else {
    //             ctx.body = {
    //                 code: 401,
    //                 msg: '没有操作的权限'
    //             }
    //         }
    //     } else {
    //         // 图片验证码验证失败
    //         ctx.body = {
    //             code: 500,
    //             msg: '图片验证码验证失败'
    //         }
    //     }
    // }

    // async updatePostByTid(ctx) {
    //     const {
    //         body
    //     } = ctx.request
    //     const result = await Post.updateOne({
    //         _id: body._id
    //     }, body)
    //     if (result.ok === 1) {
    //         ctx.body = {
    //             code: 200,
    //             data: result,
    //             msg: '更新帖子成功'
    //         }
    //     } else {
    //         ctx.body = {
    //             code: 500,
    //             data: result,
    //             msg: '编辑帖子，更新失败'
    //         }
    //     }
    // }


    // 获取文章详情

    // // 获取用户发贴记录
    // async getPostByUid(ctx) {
    //     const params = ctx.query
    //     const obj = await getJWTpayload(ctx.header.authorization)
    //     const result = await Post.getListByUid(
    //         obj._id,
    //         params.page,
    //         params.limit ? parseInt(params.limit) : 10
    //     )
    //     const total = await Post.countByUid(obj._id)
    //     if (result.length > 0) {
    //         ctx.body = {
    //             code: 200,
    //             data: result,
    //             total,
    //             msg: '查询列表成功'
    //         }
    //     } else {
    //         ctx.body = {
    //             code: 500,
    //             msg: '查询列表失败'
    //         }
    //     }
    // }

    // // 获取用户发贴记录
    // async getPostPublic(ctx) {
    //     const params = ctx.query
    //     const result = await Post.getListByUid(
    //         params.uid,
    //         params.page,
    //         params.limit ? parseInt(params.limit) : 10
    //     )
    //     const total = await Post.countByUid(params.uid)
    //     if (result.length > 0) {
    //         ctx.body = {
    //             code: 200,
    //             data: result,
    //             total,
    //             msg: '查询列表成功'
    //         }
    //     } else {
    //         ctx.body = {
    //             code: 500,
    //             msg: '查询列表失败'
    //         }
    //     }
    // }

    // // 删除发贴记录
    // async deletePostByUid(ctx) {
    //     const params = ctx.query
    //     const obj = await getJWTpayload(ctx.header.authorization)
    //     const post = await Post.findOne({
    //         uid: obj._id,
    //         _id: params.tid
    //     })
    //     if (post.id === params.tid && post.isEnd === '0') {
    //         await ContentController.prototype.deletePost(ctx)
    //         // const result = await Post.deleteOne({ _id: params.tid })
    //         // if (result.ok === 1) {
    //         //   ctx.body = {
    //         //     code: 200,
    //         //     msg: '删除成功'
    //         //   }
    //         // } else {
    //         //   ctx.body = {
    //         //     code: 500,
    //         //     msg: '执行删除失败！'
    //         //   }
    //         // }
    //     } else {
    //         ctx.body = {
    //             code: 500,
    //             msg: '删除失败，无权限！'
    //         }
    //     }
    // }

    // async deletePost(ctx) {
    //     const {
    //         body
    //     } = ctx.request
    //     const result = await Post.deleteMany({
    //         _id: {
    //             $in: body.ids
    //         }
    //     })
    //     if (result.ok === 1) {
    //         ctx.body = {
    //             code: 200,
    //             msg: '删除成功'
    //         }
    //     } else {
    //         ctx.body = {
    //             code: 500,
    //             msg: '执行删除失败！'
    //         }
    //     }
    // }

    // // 添加标签
    // async addTag(ctx) {
    //     const {
    //         body
    //     } = ctx.request
    //     const tag = new PostTags(body)
    //     await tag.save()
    //     ctx.body = {
    //         code: 200,
    //         msg: '标签保存成功'
    //     }
    // }

    // // 添加标签
    // async getTags(ctx) {
    //     const params = ctx.query
    //     const page = params.page ? parseInt(params.page) : 0
    //     const limit = params.limit ? parseInt(params.limit) : 10
    //     const result = await PostTags.getList({}, page, limit)
    //     const total = await PostTags.countList({})
    //     ctx.body = {
    //         code: 200,
    //         data: result,
    //         total,
    //         msg: '查询tags成功！'
    //     }
    // }

    // // 删除标签
    // async removeTag(ctx) {
    //     const params = ctx.query
    //     const result = await PostTags.deleteOne({
    //         id: params.ptid
    //     })

    //     ctx.body = {
    //         code: 200,
    //         data: result,
    //         msg: '删除成功'
    //     }
    // }

    // // 删除标签
    // async updateTag(ctx) {
    //     const {
    //         body
    //     } = ctx.request
    //     const result = await PostTags.updateOne({
    //             _id: body._id
    //         },
    //         body
    //     )

    //     ctx.body = {
    //         code: 200,
    //         data: result,
    //         msg: '更新成功'
    //     }
    // }

    // async updatePostBatch(ctx) {
    //     const {
    //         body
    //     } = ctx.request
    //     const result = await Post.updateMany({
    //         _id: {
    //             $in: body.ids
    //         }
    //     }, {
    //         $set: {
    //             ...body.settings
    //         }
    //     })
    //     ctx.body = {
    //         code: 200,
    //         data: result
    //     }
    // }
}

export default new ContentController()