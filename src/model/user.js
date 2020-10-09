// Mongooseæµ‹è¯•
import mongoose from '../config/DBHelpler'
import moment from 'dayjs'


const Schema = mongoose.Schema


const UserSchema = new Schema({
    username: {
        type: String,
        index: {
            unique: true
        },
        sparse: true
    },
    password: {
        type: String
    },
    name: {
        type: String
    },
    created: {
        type: Date
    },
    updated: {
        type: Date
    },
    favs: {
        type: Number,
        default: 100
    },
    gender: {
        type: String,
        default: ''
    },
    roles: {
        type: Array,
        default: ['user']
    },
    pic: {
        type: String,
        default: '/img/header.jpg'
    },
    mobile: {
        type: String,
        match: /^1[3-9](\d{9})$/,
        default: ''
    },
    status: {
        type: String,
        default: '0'
    },
    regmark: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    isVip: {
        type: String,
        default: '0'
    },
    count: {
        type: Number,
        default: 0
    }
})

// pre 前置的钩子 post 后置的钩子
UserSchema.pre('save', function (next) {
    this.created = moment().format('YYYY-MM-DD HH:mm:ss')
    next()
})
UserSchema.post('save', function (error, doc, next) {
    console.log('UserSchema.post(save) Error', error);

    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('Error:Mongoose has a duplicate key'))
    } else {
        next(error)
    }
})
UserSchema.pre('update', function (next) {
    this.update = moment().format('YYYY-MM-DD HH:mm:ss')
    next()
})

// 向由该 schema 编译生成的 Model 添加静态类方法
// 本例中第二个参数为查询出的数据过滤信息 0为不查询
UserSchema.statics = {
    findByID: function (id) {
        return this.findOne({
            _id: id
        }, {
            password: 0,
            username: 0,
            mobile: 0
        })
    },
    findByName: function (username, callback) {
        return this.findOne({
            username: username
        }, {
            password: 0 // 0 代表过滤掉该属性返回
        })
    },
    getList: function (options, sort, page, limit) {
        // 1. datepicker -> item: string, search -> array  startitme,endtime
        // 2. radio -> key-value $in
        // 3. select -> key-array $in

        let query = {}

        if (typeof options.search === 'string' && options.search.trim() !== '') {

            if (options.item === 'created') {
                const start = options.search[0]
                const end = options.search[1]

                query = {
                    created: {
                        $gte: new Date(start),
                        $lt: new Date(end)
                    }
                }
            } else if (options.item === 'roles') {
                query = {
                    roles: {
                        $in: options.search
                    }
                }

            } else if (['name', 'username'].includes(options.item)) {
                // 模糊匹配
                query[options.item] = {
                    $regex: new RegExp(options.search)
                }
                // =》 { name: { $regex: /admin/ } } => mysql like %admin%

            } else {
                // radio
                query[options.item] = options.search
            }
        }
        return this.find(query, {
                password: 0,
                mobile: 0
            })
            .sort({
                [sort]: -1
            })
            .skip(page * limit)
            .limit(limit)
    },
    countList: function (options) {
        return this.find(options).countDocuments()
    },
}




const UserModel = mongoose.model('users', UserSchema)
export default UserModel