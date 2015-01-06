window.Chat = function (socket) {
  this.socket = socket;
}

Chat.prototype.sendMessage = function (message) {
  this.socket.emit('message', { text: message });
}

Chat.prototype.changeNickName = function (newName) {
  this.socket.emit('nicknameChangeRequest', { name: newName });
}

Chat.prototype.changeRoom = function (newRoom) {
  console.log(newRoom)
  this.socket.emit('changeRoomRequest', { room: newRoom });
}
