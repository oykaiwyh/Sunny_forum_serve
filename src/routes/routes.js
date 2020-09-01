import combineRoutes from 'koa-combine-routers'

// import PublicRouter from './PublicRouter'
// import LoginRouter from './LoginRouter'
// import UserRouter from './userRouter' 
// export default combineRoutes(PublicRouter, LoginRouter, UserRouter)

//使用require.context升级
// 加载目录下得所有js文件，包括子目录
const moduleFiles = require.context('./modules', true, /\.js$/)
//拼接combineRoutes目录结构 Object[]
const modules = moduleFiles.keys().reduce((items, path) => {
    const value = moduleFiles(path)
    items.push(value.default)
    return items
}, [])





export default combineRoutes(modules)