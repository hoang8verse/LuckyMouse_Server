


const LuckyMouseSocket = (server) => {
    // console.log(" server ===============  " , server)

    const otpGenerator = require('otp-generator');
    var WebSocketServer = require('websocket').server;
    
    wsServer = new WebSocketServer({
        httpServer: server,
        // You should not use autoAcceptConnections for production
        // applications, as it defeats all standard cross-origin protection
        // facilities built into the protocol and the browser.  You should
        // *always* verify the connection's origin and decide whether or not
        // to accept it.
        autoAcceptConnections: false
    });
    
    function originIsAllowed(origin) {
      // put logic here to detect whether the specified origin is allowed.
      return true;
    }
        
    const RoomStores = [];
    function getRoom(len, roomId = null) {
        console.log("RoomStores before -------------  ", RoomStores)
        let roomRan = otpGenerator.generate(6, {
            // digits: true,
            upperCaseAlphabets: false,
            specialChars: false,
        });
        let isHost = "0";
        if(RoomStores.length == 0){
            RoomStores.push({
                room : roomId ? roomId : roomRan,
                numPlayer : 1
            })
            isHost = "1";
        } else {
            let lastRoom = RoomStores[RoomStores.length - 1];
            if(lastRoom.numPlayer < len){
                RoomStores[RoomStores.length - 1].numPlayer += 1;
            } else {
                RoomStores.push({
                    room : roomId ? roomId : roomRan,
                    numPlayer : 1
                })
                isHost = "1";
            }
        }
        console.log("RoomStores afterrrr -------------  ", RoomStores)
        let response = {
            host :  isHost,
            room :  RoomStores[RoomStores.length - 1].room
        }
        return response;
      }
    
    const rooms = {};
    var Player = require('./LuckyMouse.js');
    
    function parseVector3(str) {
        // console.log("str ============  " , str);
        var sliceString = str.slice(1,str.length - 1);
        // console.log("sliceString ============  " , sliceString);
        let arrPos = sliceString.split(',');
        // arrPos.forEach(element => {
        //     element.replace(" ", "");
        //     parseFloat(element);
        //     console.log("element ============  " , element);
        // });
        let strReturn = arrPos;
        for (let index = 0; index < arrPos.length; index++) {
            strReturn[index] = parseFloat(arrPos[index]);
        }
        
        return strReturn;
      }
    wsServer.on('request', function(request) {
        if (!originIsAllowed(request.origin)) {
          // Make sure we only accept requests from an allowed origin
          request.reject();
          console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
          return;
        }

        // remove echo-protocol
        var connection = request.accept("", request.origin);
        // var connection = request.accept( request.origin);
        console.log((new Date()) + ' request ------------   ' , request.key);
        // const clientId = otpGenerator.generate(6, {
        //     // digits: true,
        //     upperCaseAlphabets: false,
        //     specialChars: false,
        // });
        const clientId = request.key;
        console.log("clientId ===================   " ,clientId);
        const leave = room => {
            console.log("_room leave leave ===========  " , room)
            // not present: do nothing
            if(! rooms[room][clientId]) return;
            let checkNewHost = "";
            let playerRunningId = "";
            // if the one exiting is the last one, destroy the room
            if(Object.keys(rooms[room]).length === 1){
                delete rooms[room];
            }
            // otherwise simply leave the room
            else {
                let isFindNewHost = false;
                if(rooms[room][clientId]["player"]["isHost"] == "1"){
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                        // console.log("leave leave sock aaaa ad=====  " , sock["player"]);
                        if(sock["player"]["id"] != clientId && !isFindNewHost){
                            rooms[room][sock["player"]["id"]]["player"]["isHost"] = "1";
                            checkNewHost = sock["player"]["id"];
                            isFindNewHost = true;
                            console.log(" new host ------  " , sock["player"]);
                        }
                    });
                }
                if(rooms[room][clientId]["player"]["currentPlayerRunId"] == clientId){
                    playerRunningId = clientId;
                }
    
                delete rooms[room][clientId];
            }
            if(rooms[room]) {
    
                Object.entries(rooms[room]).forEach(([, sock]) => {
                    console.log("leave leave sock =====  " , sock["player"]);
                    let params = {
                        event : "playerLeaveRoom",
                        clientId : clientId,
                        newHost : checkNewHost,
                        playerRunningId : playerRunningId,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    sock.sendBytes(buffer);
                });
            }
    
        };
    
    
        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                // plant text
            }
            else if (message.type === 'binary') {
                // console.log('Received Binary Message of ' + message.binaryData + ' bytes');
                // connection.sendBytes(message.binaryData);
    
                var data = JSON.parse(message.binaryData);
                // console.log('Received Message binary :  ' +  message.binaryData);
                const { meta, room } = data;
    
                if(meta === "requestRoom") {
                    console.log("playerLen =========== binary  " , parseInt(data.playerLen))
    
                    let host = data['host'];
                    // let _room = getRoom(parseInt(data.playerLen), room);
                    let canJoin = true;
                    let _room;
                    if(host == "1"){
                        _room = room;
                    } else {
                        // _room = room.substring(0,room.length-1);
                        _room = room;
                        if(!rooms[_room]){
                            let params = {
                                event : "failJoinRoom",
                                clientId : clientId,
                                room : _room,
                                message : "Room id : " + _room + " is not availiable! Please try again.",
                            }
                            let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                            connection.sendBytes(buffer);
                            canJoin = false;
                            return;
                        }
                        else {
                            Object.entries(rooms[_room]).forEach(([, sock]) => {
                                
                                if(sock.player.isStarted == "1"){
                                    
                                    let params = {
                                        event : "failJoinRoom",
                                        clientId : clientId,
                                        room : _room,
                                        message : "Room id : " + _room + " is not availiable! Please try again.",
                                    }
                                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                                    connection.sendBytes(buffer);
                                    canJoin = false;
                                    return;
                                } 
                            });
                        }
                    }
                    
                    if(canJoin)
                    {
                        let params = {
                            event : "roomDetected",
                            clientId : clientId,
                            room : _room,
                        }
                        // let bufferArr = str2ab(JSON.stringify(params));
                        let buffer = Buffer.from(JSON.stringify(params), 'utf8');
        
                        connection.sendBytes(buffer);
                    }
                    
                }
                else if(meta === "joinLobby") {
    
                    if(!rooms[room]){
                        rooms[room] = {}; // create the room
                        // console.log(" created new aaaaaaaaaaaa room ===========  " , rooms)
    
                    }
                    if(! rooms[room][clientId]) rooms[room][clientId] = connection; // join the room
                    // console.log(' rooms[room] 111111111111 ========  ' , rooms);
    
                    var player = new Player();
                    player.id = clientId;
                    player.playerName = data.playerName;
                    player.userAppId = data.userAppId;
                    player.avatar = data.avatar;
                    player.room = room;
                    player.isSpectator = data.isSpectator;
                    player.gender = data.gender;
                    console.log( "  new player created  ----------- " , player)
    
                    rooms[room][clientId]["player"] = player;// save player in room array
                    let players = [];
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                        // console.log( "  sock ----------- " , sock.player)
                        players.push(sock.player);
                    });
                    player.isHost = data.isHost;
                    // if(players.length == 1){
                    //     player.isHost = "1";
                    // } else {
                    //     player.isHost = "0";
                    // }
                    let params = {
                        event : "joinLobbyRoom",
                        clientId : clientId,
                        playerName : player.playerName,
                        userAppId : player.userAppId,
                        avatar : player.avatar,
                        players : players,
                        isHost : player.isHost,
                        isSpectator : player.isSpectator,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                        // console.log( "  sock ----------- " , sock.player)
    
                        sock.sendBytes(buffer);
                    });
    
                }
                else if(meta === "gotoGame") {
    
                    console.log("gotoGame  data ===========  " , data)
                    let params = {
                        event : "gotoGame",
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    console.log("gotoGame  buffer========  " , buffer)
                    // console.log("startGame  rooms[room]========  " , rooms[room])
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                        rooms[room][sock["player"]["id"]]["player"]["isStarted"] = "1";
                       sock.sendBytes(buffer)
                    });
                }
                else if(meta === "join") {
    
                    // console.log(' clientId ========  ' , clientId);
    
                    if(! rooms[room]){
                        rooms[room] = {}; // create the room
                    }
                    if(! rooms[room][clientId]) rooms[room][clientId] = connection; // join the room

                    var player = rooms[room][clientId]["player"];
                    player.isStarted = "1";
                   
                    rooms[room][clientId]["player"] = player;// save player in room array
                    let players = [];
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                        // console.log( "  sock ----------- " , sock.player)
                        players.push(sock.player);
                    });
                    player.isHost = data.isHost;
                    let params = {
                        event : "joinRoom",
                        clientId : clientId,
                        playerName : player.playerName,
                        userAppId : player.userAppId,
                        avatar : player.avatar,
                        players : players,
                        isHost : player.isHost,
                        isSpectator : player.isSpectator,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                        console.log( "  sock ----------- " , sock.player)
    
                        sock.sendBytes(buffer);
                    });
    
                }
                else if(meta === "startGame") {
    
                    console.log("startGame  data ===========  " , data);
                    let maxRound  = Math.floor(Math.random() * 5) + 10;
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                        // console.log("leave leave sock aaaa ad=====  " , sock["player"]);
                        rooms[room][sock["player"]["id"]]["player"]["maxRound"] = maxRound;
                    });
                    let params = {
                        event : "startGame",
                        clientId : clientId,
                        maxRound : maxRound
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    console.log("startGame  buffer========  " , buffer)
                    // console.log("startGame  rooms[room]========  " , rooms[room])
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
                }
                else if(meta === "requestNextRun") {
    
                    console.log("requestNextRun  data ===========  " , data)
                    
                    let ranPlayerRunIndex = Math.floor(Math.random() * Object.keys(rooms[room]).length);
                    const arrayPlayers = Object.values(rooms[room]);
                    let currentPlayerRun = arrayPlayers[ranPlayerRunIndex];
                    console.log("currentPlayerRun  data ===========  " , currentPlayerRun["player"])
                    let currentRunIndex = currentPlayerRun["player"]["currentIndex"] + 1;
                    console.log("currentRunIndex ===========  " , currentRunIndex)
                    let isFinalRun = "0";
                    if(currentRunIndex == currentPlayerRun["player"]["maxRound"]){
                        isFinalRun =  "1";
                    }
                    
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                        // console.log("leave leave sock aaaa ad=====  " , sock["player"]);
                        rooms[room][sock["player"]["id"]]["player"]["currentIndex"] = currentRunIndex;
                        rooms[room][sock["player"]["id"]]["player"]["currentPlayerRunId"] = currentPlayerRun["player"]["id"]; 
                    });

                    let params = {
                        event : "responseNextRun",
                        clientId : clientId,
                        playerRun : currentPlayerRun["player"],
                        playerRunId : currentPlayerRun["player"]["id"],
                        currentRunIndex : currentRunIndex,
                        isFinalRun : isFinalRun,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    // console.log("startGame  rooms[room]========  " , rooms[room])
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
                }
                else if(meta === "playerDie") {
                    console.log("playerDie data ========================= " + data);
                    rooms[room][clientId]["player"]["playerStatus"] = "die";
                    let params = {
                        event : "playerDie",
                        clientId : clientId,
                        playerStatus :  "die"
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => sock.sendBytes(buffer));
    
                }
                else if(meta === "endGame") {
    
                    let players = [];
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                        players.push(sock.player);
                    });
                    // console.log("players  array ====================== " + players);
                    let params = {
                        event : "endGame",
                        clientId : clientId,
                        playerWin : rooms[room][clientId]["player"],
                        players :  players
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => sock.sendBytes(buffer));
                }
                else if(meta === "leave") {
    
                    leave(room);
    
                }
                else if(! meta) {
                    // send the message to all in the room
    
                    // Object.entries(rooms[room]).forEach(([, sock]) => sock.sendBytes( JSON.stringify(param) ));
                }
    
            }
        });
    
        connection.on('close', function(reasonCode, description) {
            console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
            // for each room, remove the closed socket
            Object.keys(rooms).forEach(room => leave(room));
            // console.log( " roomId ==============  " , roomId);
            // leave(roomId);
        });
    });
}
module.exports = {
    LuckyMouseSocket,
  }
