import Menu from '@/model/Menus'
import Roles from '@/model/Roles'
import User from '@/model/user'
import {
    getMenuData,
    sortMenus,
    getRights
} from '@/common/utils'
import moment from 'dayjs'
import Post from "@/model/Post";
import Comments from '@/model/Comments'
import SignRecord from '@/model/SignRecord'

const weekday = require('dayjs/plugin/weekday')
moment.extend(weekday)

class AdminController {

    // 后台管理--添加菜单
    async addMenu(ctx) {
        const {
            body
        } = ctx.request
        const menu = new Menu(body)
        const result = await menu.save()

        ctx.body = {
            code: 200,
            data: result
        }
    }

    // 后台管理--获取菜单
    async getMenu(ctx) {
        const result = await Menu.find({})
        ctx.body = {
            code: 200,
            data: sortMenus(result)

        }
    }

    // 后台管理--删除菜单
    async deleteMenu(ctx) {
        const {
            body
        } = ctx.request
        const result = await Menu.deleteOne({
            _id: body._id
        })

        ctx.body = {
            code: 200,
            data: result
        }
    }

    // 后台管理--更新菜单
    async updateMenu(ctx) {
        const {
            body
        } = ctx.request
        const data = {
            ...body
        }
        delete data._id
        const result = await Menu.updateOne({
            _id: body._id
        }, {
            ...data
        })

        ctx.body = {
            code: 200,
            data: result
        }
    }

    // 后台管理--获取角色
    async getRoles(ctx) {
        const result = await Roles.find({})
        ctx.body = {
            code: 200,
            data: result
        }
    }

    // 后台管理--添加角色
    async addRole(ctx) {
        const {
            body
        } = ctx.request
        const role = new Roles(body)
        const result = await role.save()
        ctx.body = {
            code: 200,
            data: result
        }
    }

    // 后台管理--更新角色
    async updateRole(ctx) {
        const {
            body
        } = ctx.request
        const data = {
            ...body
        }
        delete data._id
        const result = await Roles.updateOne({
            _id: body._id
        }, {
            ...data
        })
        ctx.body = {
            code: 200,
            data: result
        }
    }

    // 后台管理--删除角色
    async deleteRole(ctx) {
        const {
            body
        } = ctx.request
        const result = await Roles.deleteOne({
            _id: body._id
        })
        ctx.body = {
            code: 200,
            data: result
        }
    }

    // 后台管理--获取角色名字列表
    async getRoleNames(ctx) {
        const result = await Roles.find({}, {
            menu: 0,
            desc: 0
        })
        ctx.body = {
            code: 200,
            data: result
        }
    }

    // 后台管理--获取用户的菜单权限，菜单数据
    async getRoutes(ctx) {
        // 1. obj -> _id -> roles
        const user = await User.findOne({
            _id: ctx._id
        }, {
            roles: 1
        })
        const {
            roles
        } = user
        // 2. 通过角色 -> menus
        // 用户的角色可能有多个
        // 角色 menus -> 去重
        let menus = []
        for (let i = 0; i < roles.length; i++) {
            const role = roles[i]
            const rights = await Roles.findOne({
                role
            }, {
                menu: 1
            })
            menus = menus.concat(rights.menu)
        }
        menus = Array.from(new Set(menus)) // 去重
        // 3. menus -> 可以访问的菜单数据
        const treeData = await Menu.find({})
        // 递归查询 type = 'menu' && _id 包含在menus中
        // 结构进行改造
        const routes = getMenuData(treeData, menus, ctx.isAdmin)
        ctx.body = {
            code: 200,
            data: routes
        }
    }

    // 后台管理--获取用户的菜单权限,中资源权限
    async getOperations(ctx) {
        const user = await User.findOne({
            _id: ctx._id
        }, {
            roles: 1
        })
        const {
            roles
        } = user
        let menus = []
        for (let i = 0; i < roles.length; i++) {
            const role = roles[i]
            const rights = await Roles.findOne({
                role
            }, {
                menu: 1
            })
            menus = menus.concat(rights.menu)
        }
        menus = Array.from(new Set(menus))
        // 3. menus -> 可以访问的菜单数据
        const treeData = await Menu.find({})
        const operations = getRights(treeData, menus)
        return operations
    }

    // 后台管理--获取首页统计数据
    async getStats(ctx) {
        let result = {}

        // 1. 顶部的card
        const inforCardData = []
        const time = moment().format('YYYY-MM-DD 00:00:00')
        // 今天新增用户数
        const userNewCount = await User.find({
            created: {
                $gte: time
            }
        }).countDocuments()
        // 发帖统计
        const postCount = await Post.find({}).countDocuments()

        // 今天新增评论
        const commentsCounts = await Comments.find({
            created: {
                $gte: time
            }
        }).countDocuments()

        // 本周热议

        // weekday会去查询day是属于哪一周 weekday(1)本周的星期一
        // const day = moment('2020-10-20')
        // console.log(moment(day).weekday(1).format());
        // console.log(moment(day).weekday(7).format());

        // 重置时分秒
        const nowZero = new Date().setHours(0, 0, 0, 0)
        const starttime = moment(nowZero).weekday(1)
        const endtime = moment(nowZero).weekday(8)
        const weekEndCount = await Comments.find({
            created: {
                $gte: starttime,
                $lte: endtime
            },
            isBest: '1'
        }).countDocuments()

        // 本周签到
        const signWeekCount = await SignRecord.find({
            created: {
                $gte: starttime,
                $lte: endtime
            }
        }).countDocuments()
        // 本周发帖
        const postWeekCount = await Post.find({
            created: {
                $gte: starttime,
                $lte: endtime
            }
        }).countDocuments()
        inforCardData.push(userNewCount)
        inforCardData.push(postCount)
        inforCardData.push(commentsCounts)
        inforCardData.push(weekEndCount)
        inforCardData.push(signWeekCount)
        inforCardData.push(postWeekCount)

        // 2. 左侧的饼图数据

        const postsCatalogCount = await Post.aggregate([{
            $group: {
                _id: '$catalog',
                count: {
                    $sum: 1
                }
            }
        }])

        const pieData = {}
        postsCatalogCount.forEach((item) => {
            pieData[item._id] = item.count
        })

        // 3. 本周的右侧统计数据
        // 3.1 计算6个月前的时间： 1号 00:00:00
        // 3.2 查询数据库中对应时间内的数据 $gte
        // 3.3 group组合 -> sum -> sort排序

        // const startMonth = moment('2020-10-10').subtract(5, 'M').date(1).format() // 2020-05-01T00:00:00+08:00 
        // const endMonth = moment('2020-10-10').add(1, 'M').date(1).format()        // 2020-11-01T00:00:00+08:00
        // const endMonth = moment('2020-10-10').date(31).format('YYYY-MM-DD 23:59:59') // 2020-10-31 23:59:59
        const startMonth = moment(nowZero).subtract(5, 'M').date(1).format()
        const endMonth = moment(nowZero).add(1, 'M').date(1).format()
        let monthData = await Post.aggregate([{
                $match: {
                    created: {
                        $gte: new Date(startMonth),
                        $lt: new Date(endMonth)
                    }
                }
            },
            {
                // 格式化
                $project: {
                    // 结构化的对象对应$group中的 _id:$month , 
                    // create: {
                    month: {
                        $dateToString: {
                            format: '%Y-%m',
                            date: '$created' // 需要结构化的 key -> created
                        }
                    }
                }
            },
            {
                // 以月份分组 1 2 3 ...
                $group: {
                    // _id:'$create',
                    _id: '$month',
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                //排序
                $sort: {
                    _id: 1
                }
            }
        ])

        // 将数组转换为对象
        monthData = monthData.reduce((obj, item) => {
            return {
                ...obj,
                [item._id]: item.count
            }
        }, {})


        // 4. 底部的数据
        const startDay = moment().subtract(7, 'day').format()
        const _aggregate = async (model) => {
            let result = await model.aggregate([{
                    $match: {
                        created: {
                            $gte: new Date(startDay)
                        }
                    }
                },
                {
                    $project: {
                        month: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$created'
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: '$month',
                        count: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                }
            ])
            result = result.reduce((obj, item) => {
                return {
                    ...obj,
                    [item._id]: item.count
                }
            }, {})
            return result
        }
        const userWeekData = await _aggregate(User) // -> { 2019-10-01: 1}
        const signWeekData = await _aggregate(SignRecord)
        const postWeekData = await _aggregate(Post)
        const commentsWeekData = await _aggregate(Comments)
        // {user: [1,2,3,4,0,0,0]}
        const dataArr = []
        for (let i = 0; i <= 6; i++) {
            dataArr.push(moment().subtract(6 - i, 'day').format('YYYY-MM-DD'))
        }
        const addData = (obj) => {
            const arr = []
            dataArr.forEach((item) => {
                if (obj[item]) {
                    arr.push(obj[item])
                } else {
                    arr.push(0)
                }
            })
            return arr
        }
        const weekData = {
            user: addData(userWeekData),
            sign: addData(signWeekData),
            post: addData(postWeekData),
            comments: addData(commentsWeekData)
        }

        result = {
            inforCardData,
            pieData,
            monthData,
            weekData
        }

        ctx.body = {
            code: 200,
            data: result
        }

    }

}
export default new AdminController()