### mock数据
#### http://www.toimc.com:10040/html/web/controller/public/public.html#5d0666bebaa920000bb519b1
Mock Server地址：http://www.toimc.com:10040/mock/5d0666bebaa920000bb519b1
et.js不会去请求mock server地址而去请求真实地址（举例：node net.js http://www.toimc.com:10040/mock/5d0666bebaa920000bb519b1 http://localhost:8081) ,然后将您开发工程下的根地址替换为localhost:36742即可开启您的Mock之旅！


### 文件 fs

#### 判断文件目录是否存在 fs.stat 
const isExists = fs.stat(path, (err, stats) => err ? resolve(false) : resolve(stats))
可通过判断返回的stats 是否为文件类型
isExists.isDirectory()

#### 创建文件夹 fs.mkdir
fs.mkdir(path, err => err ? resolve(false) : resolve(true))

#### 读取文件 fs.createReadStream(path[, options]) 节约内存，大文件使用
`https://nodejs.org/docs/latest-v10.x/api/fs.html#fs_fs_createreadstream_path_options`

#### 读取文件 fs.readFile(path[, options], callback) 资源存储于内存，小文件可使用
`https://nodejs.org/docs/latest-v10.x/api/fs.html#fs_fs_readfile_path_options_callback`

#### 写文件 fs.createWriteStream(path[, options]) 节约内存，大文件使用
`https://nodejs.org/docs/latest-v10.x/api/fs.html#fs_fs_createreadstream_path_options`



### 路径 path
#### 判断当前目录dire的上一级目录是否存在
path.parse(dire).dir


### Mongoose---Populate（填充） sql里join的聚合操作，那就是$lookup(会全部查询) 
### Mongoose---$inc
### Mongodb 操作符 $eq 等于 $in 包含 等等。。。 https://www.mongodb.org.cn/manual/query-comparison/
### Mongodb 对返回的查询数据结构进行变更 data.toJSON()



### 对于前端get请求传递的是一个对象options{...}时，后端接收到的却不是一个对象
params:
    option[item]: roles
    option[search][0]: admin
    option[search][1]: super_admin

1、改为post请求直接接收data数据
2、使用qs库，转换请求数据 qs.parse(params)


get ctx.query
post ctx.request.body

// 将数组转换为对象
monthData = monthData.reduce((obj, item) => {
    return {
        ...obj,
        [item._id]: item.count
    }
}, {})

