<!-- 端口占用 package.json-->
"dev": "cross-env NODE_ENV=dev nodemon --exec babel-node --inspect=9000 ./src/index.js",
<!-- 图形验证码 svg-captcha-->
npm install --save svg-captcha
<!-- 邮箱服务 nodemailer-->
npm install --save nodemailer

<!-- 邮箱服务 moment-->
npm install --save nodemailer

<!-- 时间格式 moment -->
npm install --save moment

<!-- 数据连接 mongoose -->
npm install --save mongoose

<!-- mongodb数据密码安全 saslprep -->
npm install --save saslprep

<!-- 数据缓存 redis -->
<!--https://github.com/NodeRedis/node-redis  -->
npm install --save redis


<!-- cookie 跨端表现不好 移动 -->

<!-- koa-jwt 权限校验 -->
 npm install -S koa-jwt
<!-- token生成  -->
npm install -S jsonwebtoken


<!-- 同步运行脚本 npm-run-all  -->
npm install -D npm-run-all
package 添加脚本 start:dist

<!-- 密码加密 bcrypt  有node版本的要求10.x以上-->
npm install -S bcrypt

<!--  dayjs  -->
npm install -S dayjs

<!-- 随机签名 -->
npm install -s uuid

<!-- 文件上传  递归执行创建目录-->
npm install -s make-dir

<!-- 日志 只能对正常的请求进行持久化，不会去对错误的请求做记录-->
npm install -s koa-logger

<!-- 日志 log4  使用koa封装的koa-log4-->
npm install -s koa-log4@2








