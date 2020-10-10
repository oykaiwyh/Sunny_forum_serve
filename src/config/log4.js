import log4js from 'koa-log4'

// https://github.com/dominhhai/koa-log4js-example/blob/v2.x/log4js.json
// Log4js - Appenders
// https://log4js-node.github.io/log4js-node/appenders.html
log4js.configure({
    // 自己需要定义几个日志规则 格式 :
    // "规则名": {
    //     type: categoryFilter / console / dateFile, // Log4js - Appenders 不同类型的Appenders有不同的配置需求，参照上述文档
    // },
    appenders: {
        access: {
            type: 'dateFile',
            filename: 'logs/access.log',
            pattern: '-YYYY-MM-dd.log', //后缀
        },
        applications: {
            type: 'dateFile',
            filename: 'logs/app.log',
            pattern: '-YYYY-MM-dd.log',
        },
        error: {
            type: 'dateFile',
            filename: 'logs/error.log',
            pattern: '-YYYY-MM-dd.log',
        },
        defaultout: {
            type: 'dateFile',
            filename: 'logs/defaultout.log',
            pattern: '-YYYY-MM-dd.log',
        },
        out: {
            type: 'console'
        },
    },
    // category 配置生效appenders（规则）以及生效级别等
    /**
     * @description level 级别
     * @description https://github.com/log4js-node/log4js-node/blob/master/examples/example.js
     * @description https://log4js-node.github.io/log4js-node/api.html ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF 
     * @description 级别由轻到严重，打印输入时，是向上打印的，定义级别太高，级别低的是不会打印的 error级别只会打印 error/fatal相关信息
     *              info 会打印 info/log/warn/error/fatal
     * @description 以下是官方示例
     * @param const logger = log4js.getLogger('cheese');
     * @description appenders: {
                        cheeseLogs: { type: 'file', filename: 'cheese.log' },
                    },
                    categories: {
                        cheese: { appenders: ['cheeseLogs'], level: 'error' },  //定义级别error，级别很高
                    }
     * these will not appear (logging level beneath error)
     * @param {String} trace logger.trace('Entering cheese testing');
     * @param {String} debug logger.debug('Got cheese.');
     * @param {String} info logger.info('Cheese is Gouda.');
     * @param {String} log logger.log('Something funny about cheese.');
     * @param {String} warn logger.warn('Cheese is quite smelly.');
     * 
     * these end up only in cheese.log 只有error/ fatal的level才会记录在文件中
     * @param {String} error logger.error('Cheese %s is too ripe!', 'gouda');
     * @param {String} fatal logger.fatal('Cheese was breeding ground for listeria.');
     */
    categories: {
        // 如果此处未定义生效的规则，业务中使用了相应的规则，是不会生效的哦,但是呢会调用默认日志记录哦！！！
        access: {
            appenders: ['access'], //此处对应定义的规则名
            level: 'info' // 级别
        },
        applications: {
            appenders: ['applications'],
            level: 'warn'
        },
        error: {
            appenders: ['error'],
            level: 'warn'
        },
        // 默认的是必须定义的
        default: {
            // appenders: ['out'],
            // appenders: ['defaultout', 'out'],
            appenders: ['defaultout'],
            level: 'info'
        },
    }
})


export default log4js