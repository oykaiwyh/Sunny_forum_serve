import User from './test'

const user = {
    name: 'qq',
    age: 12
}

//增
const run = async () => {
    const data = new User(user)
    const result = await data.save()
    console.log(result);
}

// run()

//查
const runfind = async () => {
    const result = await User.find()
    console.log(result);
}

// runfind()

// 改
const runupdate = async () => {
    const result = await User.updateOne({ //One不能更新得增加一个没有得属性
        name: 'qq'
    }, {
        age: 33
    })
    console.log(result); // { n: 1, nModified: 1, ok: 1 }  
}

// runupdate()

// 删
const rundelete = async () => {
    const result = await User.deleteOne({
        name: 'qq'
    })
    console.log(result); // { n: 1, ok: 1, deletedCount: 1 }
}

rundelete()