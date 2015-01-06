var createChat = function (server) {
  var io = require('socket.io')(server);
  var guestnumber = 0;
  var nickNames = {};
  var currentRooms = {};

  var issueGuestName = function (currentNumber, socket) {
    var tempName = 'Guest' + currentNumber;
    var names = []

    if (nickNames[socket.id]) { return; }
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

  var handleConnect = function (socket) {
    guestnumber++;
    issueGuestName(guestnumber, socket);
    var previousNames = JSON.parse(JSON.stringify(nickNames));
    delete previousNames[socket.id];
    socket.emit('welcome', {
      name: "System",
      text: 'You are connected as ' + nickNames[socket.id]
    });
    for (id in previousNames) {
      if (currentRooms[id] != currentRooms[socket.id]) {
        console.log(currentRooms[id]);
        delete previousNames[id];
      }
    }
    socket.emit('newUsers', previousNames);
    io.to(currentRooms[socket.id]).emit('newUsers', { name: nickNames[socket.id]});
  };

  var handleDisconnect = function (partialDisconnect) {
    guestnumber--;
    io.to(currentRooms[this.id]).emit('disconnected', {
      name: nickNames[this.id]
    });
    partialDisconnect || delete nickNames[this.id];
  };

  var sendMessage = function (data) {
    io.to(currentRooms[this.id]).emit('message', {
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
        io.to(currentRooms[this.id]).emit('nicknameChangeResult', result);
        return;
      }
    }

    this.emit('nicknameChangeResult', result)
  };

  var changeRoom = function (data) {
    var newRoom = data.room
    var oldRoom = currentRooms[this.id]
    this.join( newRoom );
    this.leave( oldRoom );
    handleDisconnect(true);
    currentRooms[this.id] = newRoom;
    handleConnect(this);
  };

  io.on('connection', function (socket) {
    socket.join( 'lobby' )
    currentRooms[socket.id] = "lobby";
    handleConnect(socket);

    socket.on('disconnect', handleDisconnect.bind(socket, false));

    socket.on('message', sendMessage.bind(socket));

    socket.on('nicknameChangeRequest', changeName.bind(socket));

    socket.on('changeRoomRequest', changeRoom.bind(socket))
  });
}

exports.createChat = createChat;
