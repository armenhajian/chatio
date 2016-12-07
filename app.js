const express = require('express');
const http = require('http');

//const socket = require('./app/socket.js');

const app = express();
const server = http.createServer(app);

/* Configuration */
//app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.set('port', 3000);

if (process.env.NODE_ENV === 'development') {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}
const users = [];
const groups = {};
const messages = [];
const sockets = {};
const groupMessages = {};

const io = require('socket.io').listen(server);
io.sockets.on('connection', socket=>{
    console.log('socket connected!');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    socket.on('user:join', data => {
        data._id = new Date().getTime()*Math.random();
        users.push(data);
        //console.log('user:join', users);
        sockets[data._id] = socket;
        socket.emit('redirectToChat', {user:data,users:getUserList(data)})
        io.emit('new user', {user:data,users:users})
    })
    socket.on('createGroup', data=>{
        data._id = new Date().getTime()*Math.random();
        groups[data._id] = data;

        socket.join(data._id);
        data.users.map(userId=>{
            sockets[userId].join(data._id);
        });
        let _data = {notification:'You are added to group', groupList:groups};
        console.log(_data)
        socket.emit('new group', _data);
        socket.broadcast.to(data._id).emit('new group', _data);
    })
    socket.on('message',msg=>{
        msg._id = new Date().getTime()*Math.random();
        messages.push(msg);
        io.emit('message', messages);
    })
    socket.on('group-message',data=>{
        //msg._id = new Date().getTime()*Math.random();
        if(!groupMessages[data.groupId]) {
            groupMessages[data.groupId] = [];
        }
        groupMessages[data.groupId].push(data);
        console.log('groupMessages', groupMessages)
        socket.emit('group-message', groupMessages[data.groupId])
        socket.broadcast.to(data.groupId).emit('group-message', groupMessages[data.groupId])
    })
    socket.on('typing', user=>{
        socket.broadcast.emit('typing', user);
    })
});

function getUserList(exclude) {
    return users.filter(u=>{
        return u.username != exclude.username
    })
}

/* Start server */
server.listen(app.get('port'), function (){
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;
