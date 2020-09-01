// Mongoose测试
import mongoose from '../config/DBHelpler'


const TestSchema = mongoose.Schema({
    name: {
        type: String
    },
    age: {
        type: Number
    }
})

const TestModel = mongoose.model('users', TestSchema)
export default TestModel