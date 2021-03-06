$( "document" ).ready(function () {
  var socket = io();
  var chat = new Chat(socket);
  var $main = $(".chat");
  var $chatRoom = $(".chat-room");
  var $users = $(".users");
  var commands = {
    "/nick": chat.changeNickName,
    "/join": chat.changeRoom,
  }

  var welcomeUser = function (data) {
    $chatRoom.empty();
    $users.empty();
    postMessage(data);
  }

  var postMessage = function (data) {
    var $newStrong = $("<strong>").text(data.name)
    var $newLi = $("<li>").text(": " + data.text);
    $newLi.prepend($newStrong);
    $chatRoom.append($newLi);
  }

  var addUsers = function (data) {
    for (attr in data) {
      var $newStrong = $("<strong>").text(data[attr]);
      var $newLi = $("<li>").append($newStrong);
      $users.append($newLi);
    }
  }

  var removeUser = function (data) {
    $($users.children()).each(function () {
      if ($(this).text() === data.name) {
        $(this).remove()
        return;
      }
    });
  }

  var processMessage = function (event) {
    event.preventDefault();
    var commandReg = /^\/\w*/
    var $target = $(event.currentTarget);
    var message = $target.serializeJSON().message;
    $target.find("input").val('')
    if (commandReg.exec(message)) {
      allmessages = []
      var realMessage = message.split(commandReg)[1].trim();
      console.log(realMessage);
      command = commands[commandReg.exec(message)[0]];
      command.call(chat, realMessage)
    } else {
      chat.sendMessage(message);
    }
  };

  var processNameChange = function (data) {
    var message = { name: "System"}
    if (data.success) {
      message.text = data.oldName + " has changed their name to " + data.name
      var $oldNameEls = $( "strong:contains(" + data.oldName + ")" );
      $oldNameEls.text(data.name);
    } else {
      message.text = data.message
    }
    postMessage(message)
  }

  var handleDisconnect = function (data) {
    var message = { name: "System", text: "You have been disconnected"};
    welcomeUser(message);
  }

  $(".submission").on('submit', processMessage);
  socket.on('message', postMessage);
  socket.on('newUsers', addUsers);
  socket.on('disconnected', removeUser);
  socket.on('nicknameChangeResult', processNameChange);
  socket.on('disconnect', handleDisconnect);
  socket.on('welcome', welcomeUser);
});
