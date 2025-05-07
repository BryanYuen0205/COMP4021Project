import Game from './game.js';

const Socket = (function() {
    // This stores the current Socket.IO socket
    let socket = null;

    // This function gets the socket from the module
    const getSocket = function() {
        return socket;
    };

    // This function connects the server and initializes the socket
    const connect = function() {
        console.log("in the socket connect function");
        
        socket = io();
        // Wait for the socket to connect successfully
        socket.on("connect", () => {        
            // Trying to get all existing players  
            // UNCOMMMENT IF NOT WORKING
            // socket.emit("get players");
            console.log("browser successfully connected");
        });

        socket.on("greeting", () => {
            console.log("Received message from server ok!");
        })

        socket.on("prepareMultiplayer", () => {
            socket.emit("get players");
        })

        // Add existing remote players
        socket.on("players", (onlineUsers) => {
            Game.addExistingRemotePlayers(onlineUsers);
        })

        // Add new player
        socket.on("newPlayer", (player) => {
            Game.addNewRemotePlayer(player);
        });

        // Move other remote players 
        socket.on("playerMove", (playerAction) => {
            Game.moveRemotePlayer(playerAction);
        })

        // Stop other remote players 
        socket.on("playerStop", (playerAction) => {
            Game.stopRemotePlayer(playerAction);
        })

        // Increase the speed of the player
        socket.on("increaseSpeed", (player) => {
            Game.increaseSpeed(player);
        })

        socket.on("decreaseSpeed", (player) => {
            Game.decreaseSpeed(player);
        })

        // Update the gem position
        socket.on("setGemAttr", (newGemAttr) => {
            // console.log("Setting up new gem attributes");
            const gemColor = newGemAttr.gemColor;
            const gemPos = newGemAttr.gemPosition;
            Game.setGemAttr(gemColor, gemPos);
        })

        // Update the boots position
        socket.on("setBootsPos", (bootsPos) => {
            Game.setBoots(bootsPos);
        })

        // Update the number of players waiting
        socket.on("waitingRoomUpdate", ({ numWaitingPlayers }) => {
            $("#player-count").text(numWaitingPlayers);
        });

        // Start the game
        socket.on("startGame", (gameAttr) => {
            console.log("Starting the game bro");
            
            const gemColor = gameAttr.gemColor;
            const gemPos = gameAttr.gemPosition;
            const bootsPos = gameAttr.bootsPos;
            const seshUser = gameAttr.seshUser;
            // $("#player-count").text(gameAttr.numWaitingPlayers);
            if(gameAttr.numWaitingPlayers == 2){
                setTimeout(() => {
                    // Game.setCurrPlayer(seshUser)
                    Game.setGemAttr(gemColor, gemPos);
                    Game.setBoots(bootsPos);
                    $("#waiting-overlay").hide();
                    Game.startGame();
                }, 2000)
            }
        });
    };

    // This function disconnects the socket from the server
    const disconnect = function() {
        socket.disconnect();
        socket = null;
    };

    // This function sends a post message event to the server
    const postMessage = function(content) {
        if (socket && socket.connected) {
            socket.emit("post message", content);
        }
    };


    return { getSocket, connect, disconnect, postMessage };
})();

// This makes Socket accessible globally even when using ES modules.
window.Socket = Socket;
