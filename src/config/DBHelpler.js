import mongoose from 'mongoose'
import config from './index'

mongoose.connect(config.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true //数据库字段中创建索引5.x版本以上调用的是ensureIndex()函数，开启使用createIndex()函数
})

//连接成功
mongoose.connection.on('connected', () => {
    console.log('Mongoose is Connection open to ' + config.DB_URL);
})
// 连接异常
mongoose.connection.on('error', (error) => {
    console.log('Mongoose is Connection error to ' + error);
})
// 断开连接
mongoose.connection.on('disconnected', () => {
    console.log('Mongoose is DisConnection error to ');
})

export default mongoose