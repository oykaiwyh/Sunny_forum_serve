const webSocket = require('ws')
// import webSocket from 'ws'

const wss = new webSocket.Server({
    port: 3000
})

wss.on('connection', function connection(ws) {
    console.log('connection');
})