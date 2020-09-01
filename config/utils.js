const path = require('path')

exports.resolve = function resolve(dir) {
    return path.join(__dirname, '..', dir)
}

exports.APP_PATH = exports.resolve('src')
exports.DIST_PATH = exports.resolve('dist')

exports.getWebpackResolveConfig = function (customAlias = {}) {
    const appPath = exports.APP_PATH;
    return {
        modules: [appPath, 'node_modules'], //匹配alias的目录
        extensions: ['.js', '.json'], //相关文件后缀也匹配alias
        alias: {
            '@': appPath,
            ...customAlias
        }
    }
}