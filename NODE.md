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


