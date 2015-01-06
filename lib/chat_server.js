var createChat = function (server) {
  var io = require('socket.io')(server);
  var guestnumber = 0;
  var nickNames = {};

  var issueGuestName = function (currentNumber, socket) {
    var tempName = 'Guest' + currentNumber;
    var names = []

    for (id in nickNames) {
      if (nickNames[id] === tempName) {
        issueGuestName(++currentNumber, socket);
        return;
      } else {
        nickNames[socket.id] = tempName;
      }
    }

    if (!nickNames[socket.id]) {
      nickNames[socket.id] = tempName
    }
  };

  var handleDisconnect = function () {
    guestnumber--;
    io.emit('disconnected', { name: nickNames[this.id] });
    delete nickNames[this.id];
  };

  var sendMessage = function (data) {
    io.emit('message', {
      name: nickNames[this.id],
      text: data.text
    });
  };

  var changeName = function (data) {
    var result = {};
    var nameReg = /guest/;
    for (attr in nickNames) {
      if (nameReg.test(data.name.toLowerCase())) {
        result.success = false;
        result.message = 'Names cannot begin with ' + data.name;
      } else if (nickNames[attr] === data.name) {
        result.success = false;
        result.message = 'That nickname is already taken'
      } else {
        result.oldName = nickNames[this.id];
        nickNames[this.id] = data.name
        result.success = true;
        result.name = data.name;
        io.emit('nicknameChangeResult', result);
        return;
      }
    }

    this.emit('nicknameChangeResult', result)
  };

  io.on('connection', function (socket) {
    guestnumber++;
    issueGuestName(guestnumber, socket);
    previousNames = JSON.parse(JSON.stringify(nickNames));
    delete previousNames[socket.id];
    socket.emit('welcome', {
      name: "System",
      text: 'You are connected as ' + nickNames[socket.id]
    });
    socket.emit('newUsers', previousNames);
    io.emit('newUsers', { name: nickNames[socket.id]});

    socket.on('disconnect', handleDisconnect.bind(socket));

    socket.on('message', sendMessage.bind(socket));

    socket.on('nicknameChangeRequest', changeName.bind(socket));
  });
}

exports.createChat = createChat;
