import Menu from '@/model/Menus'
import Roles from '@/model/Roles'
import User from '@/model/user'
import {
    getMenuData,
    sortMenus,
    getRights
} from '@/common/utils'


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

}
export default new AdminController()