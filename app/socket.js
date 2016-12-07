module.exports = function (socket) {

    socket.on('user:join', function (data) {
        users
        socket.broadcast.emit('send:message', {
            user: name,
            text: data.text
        });
    });

};
