import mongoose from '../config/DBHelpler'
import moment from 'dayjs'

const Schema = mongoose.Schema

const CommentsSchema = new Schema({
    tid: {
        type: String,
        ref: 'post'
    },
    uid: {
        type: String,
        ref: 'users'
    },
    cuid: {
        type: String,
        ref: 'users'
    },
    content: {
        type: String
    },
    created: {
        type: Date
    },
    hands: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: '1'
    },
    isRead: {
        type: String,
        default: '0'
    },
    isBest: {
        type: String,
        default: '0'
    }
}, {
    toJSON: {
        virtuals: true // 虚拟值默认不会被 toJSON() 输出
    }
})

CommentsSchema.pre('save', function (next) {
    this.created = new Date()
    next()
})

CommentsSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'))
    } else {
        next(error)
    }
})

CommentsSchema.statics = {
    // 查询某个评论
    findByTid: function (id) {
        return this.find({
            tid: id
        })
    },
    findByCid: function (id) {
        return this.findOne({
            _id: id
        })
    },
    // 获取评论列表
    getCommentsList: function (id, page, limit) {
        return this.find({
            tid: id
        }).populate({
            path: 'cuid',
            select: '_id name pic isVip',
            match: { // 对于某些字段满足条件才能返回
                status: {
                    $eq: '0'
                }
            }
        }).populate({
            path: 'tid',
            select: '_id title static',
        }).skip(page * limit).limit(limit)
    },
    // 获取总页数
    queryCount: function (id) {
        return this.find({
            tid: id
        }).countDocuments()
    },
    getCommetsPublic: function (id, page, limit) {
        return this.find({
                cuid: id
            })
            .populate({
                path: 'tid',
                select: '_id title'
            })
            .skip(page * limit)
            .limit(limit)
            .sort({
                created: -1
            })
    },
    getMsgList: function (id, page, limit) {
        return this.find({
                uid: id,
                cuid: {
                    $ne: id // 隔离掉自己评论自己
                },
                isRead: {
                    $eq: '0'
                }, // 未读状态
                status: {
                    $eq: '1'
                } // 是否显示
            })
            .populate({ // 替换字段信息
                path: 'tid',
                select: '_id title content'
            })
            .populate({
                path: 'uid',
                select: '_id name'
            })
            .populate({
                path: 'cuid',
                select: '_id name'
            })
            .skip(limit * page)
            .limit(limit)
            .sort({
                created: -1
            })
    },
    getTotal: function (id) {
        return this.find({
            uid: id,
            isRead: '0',
            status: '1'
        }).countDocuments()
    },

}

const Comments = mongoose.model('comments', CommentsSchema)

export default Comments