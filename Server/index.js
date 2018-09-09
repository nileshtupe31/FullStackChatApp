var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var userList = [];
var chats = [];

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');

    socket.on("connectUser", function(clientNickname) {
      var message = "User " + clientNickname + " was connected.";
      console.log(message);

      var userInfo = {};
      var foundUser = false;
      for (var i=0; i<userList.length; i++) {
        if (userList[i]["nickname"] == clientNickname) {
          userList[i]["isConnected"] = true
          userList[i]["id"] = socket.id;
          userInfo = userList[i];
          foundUser = true;
          break;
        }
      }

      if (!foundUser) {
        userInfo["id"] = socket.id;
        userInfo["nickname"] = clientNickname;
        userInfo["isConnected"] = true
        userList.push(userInfo);
      }

      socket.emit("userList", userList); // Send to sender only
      socket.broadcast.emit("userConnectUpdate", userInfo) // send to all users except sender
      socket.emit("chats",chats) // send to sender only
    });

    socket.on("disconnectUser", function(clientNickname) {

      var userInfo = {};
      var index = -1
      for (var i=0; i<userList.length; i++) {
        if (userList[i]["nickname"] == clientNickname) {
          userList[i]["isConnected"] = true
          userList[i]["id"] = socket.id;
          userInfo = userList[i];
          index = i;
          break;
        }
      }

      if (index != -1) {
        userList.splice(index, 1);
        socket.broadcast.emit("userLeft", userInfo) // send to all users except sender
        var message = "User " + clientNickname + " left.";
        console.log(message);
      }

    });


    socket.on("allChats", function() {
        socket.emit("chats",chats) // send to sender only
    });

    socket.on("sendNewMessage", function(message) {

      console.log('Message Sent');

      var chatMessage = {}

      var userInfo = {};
      var foundUser = false;
      for (var i=0; i<userList.length; i++) {
        if (userList[i]["nickname"] == message["nickName"]) {
          userList[i]["isConnected"] = true
          userList[i]["id"] = socket.id;
          userInfo = userList[i];
          foundUser = true;
          break;
        }
      }

      if (foundUser) {
        chatMessage["user"] = userInfo;
        chatMessage["message"] = message["message"];

        io.emit("newMessageBroadcast", chatMessage)
        chats.push(chatMessage)
        console.log('Message Sent'+chatMessage);
      }

    });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
