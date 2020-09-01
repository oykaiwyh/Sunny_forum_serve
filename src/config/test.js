// redis测试
// npx babel-node .\src\config\test.js 执行
import {
    getValue,
    setValue,
    getHvalue
} from './RedisConfig'

setValue('Test', 'this is NodeRedis Test')
setValue('TestObject', {
    name: 'zhangshan',
    age: 12
})


getValue('Test').then(res => {
    console.log('gteValue = ' + res);
})
getHvalue('TestObject').then(res => {
    console.log('get TestObject = ' + JSON.stringify(res));
})