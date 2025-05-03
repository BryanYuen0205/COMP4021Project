import Player from './player.js';
import Gem from './gem.js';
import BoundingBox from './bounding_box.js';
import Fire from './fire.js';
import Bomb from './bomb.js';

const Game = (function (){
    
/* Get the canvas and 2D context */
    const cv = $("canvas").get(0);
    const context = cv.getContext("2d");

    /* Create the sounds */
    // const sounds = {
    //     background: new Audio("./music/background.mp3"),
    //     collect: new Audio("./music/collect.mp3"),
    //     gameover: new Audio("./music/gameover.mp3")
    // };

    const totalGameTime = 100;   // Total game time in seconds
    const gemMaxAge = 3000;     // The maximum age of the gems in milliseconds
    let currPlayer = null;
    let currPlayerUsername = null;
    let gameStartTime = 0;      // The timestamp when the game starts
    let collectedGems = 0;      // The number of gems collected in the game
    let remotePlayers = {};


    /* Create the game area */
    const gameArea = BoundingBox(context, 165, 60, 420, 800);

    const gameAreaPoints = gameArea.getPoints();
    
    const fires = [
        Fire(context, gameAreaPoints.bottomRight[0], gameAreaPoints.bottomRight[1]),
        Fire(context, gameAreaPoints.topLeft[0], gameAreaPoints.topLeft[1]),
    ]

    const bombs = [
        Bomb(context, gameAreaPoints.bottomLeft[0], gameAreaPoints.bottomLeft[1]),
        Bomb(context, gameAreaPoints.topRight[0], gameAreaPoints.topRight[1])
    ]

    /* Create the sprites in the game */
    // const player = Player(context, 427, 240, gameArea); // The player
    const gem = Gem(context, 427, 350, "green");        // The gem

    // Adds new remote players
    const addNewRemotePlayer = function (player){        
        if(currPlayer && player.username != currPlayerUsername){
            remotePlayers[player.username] = Player(context, player.x, player.y, gameArea);
        }
    }

    // Adds existing remote players
    const addExistingRemotePlayers = function (players) {
        // Only add players that are not the current player
        for (const player in players){
            if(currPlayerUsername != player){
                remotePlayers[player] = Player(context, 427, 240, gameArea);
            }
        }
    }

    // This function sets the current player 
    const setCurrPlayer = function(user){
        currPlayer = Player(context, 427, 240, gameArea);
        currPlayerUsername = user.username;
        // console.log("Current player " + currPlayerUsername + " has been set!");
    }

    // This function moves other remote players 
    const moveRemotePlayer = function (playerAction){        
        if(remotePlayers[playerAction.player]){
            remotePlayers[playerAction.player].move(playerAction.moveNum);
        }
    }
    
    // This function stops other remote players 
    const stopRemotePlayer = function (playerAction){
        if(remotePlayers[playerAction.player]){
            remotePlayers[playerAction.player].stop(playerAction.moveNum);
        }
    }

    // Emits current player's stoping position to other remote clients
    const emitMovingPosition = function (player, moveNum){
        const socket = window.Socket.getSocket();
        if(socket){
            socket.emit("move", {player:player, moveNum:moveNum});
        }
    }

    // Emits current player's moving position to other remote clients
    const emitStoppingPosition = function (player, moveNum){
        const socket = window.Socket.getSocket();
        if(socket){
            socket.emit("stop", {player:player, moveNum:moveNum});
        }
    }


    /* The main processing of the game */
    function doFrame(now) {
        if (gameStartTime == 0) gameStartTime = now;

        /* Update the time remaining */
        const gameTimeSoFar = now - gameStartTime;
        const timeRemaining = Math.ceil((totalGameTime * 1000 - gameTimeSoFar) / 1000);
        $("#time-remaining").text(timeRemaining);


        /* TODO */
        /* Handle the game over situation here */
        if(timeRemaining == 0){
            $("#game-over").show();
            $("#final-gems").html(collectedGems);
            // sounds.background.pause();
            // sounds.collect.pause();
            // sounds.gameover.play();
            return;
        }

        /* Update the sprites */
        gem.update(now);
        currPlayer.update(now);
        for(let i = 0; i < fires.length; i++)
            fires[i].update(now);
        for(let i = 0; i < bombs.length; i++)
            bombs[i].update(now);

        /* TODO */
        /* Randomize the gem and collect the gem here */
        if(gem.getAge(now) >= gemMaxAge){
            gem.randomize(gameArea);
        }
        let playerBoundingBox = currPlayer.getBoundingBox();
        let gemPos = gem.getXY();                        
        
        if(playerBoundingBox.isPointInBox(gemPos.x, gemPos.y)){
            collectedGems++;
            // console.log(collectedGems);
            // sounds.collect.play();
            gem.randomize(gameArea);
        }

        /* Clear the screen */
        context.clearRect(0, 0, cv.width, cv.height);

        /* Draw the sprites */
        gem.draw();
        // player.draw();
        currPlayer.draw();

        for (let username in remotePlayers){
            remotePlayers[username].update(now);
            remotePlayers[username].draw();
        }

        for(let i = 0; i < fires.length; i++)
            fires[i].draw();
        for(let i = 0; i < bombs.length; i++)
            bombs[i].draw(now);

        /* Process the next frame */
        requestAnimationFrame(doFrame);
    }

    /* Handle the start of the game */
    $("#game-start").on("click", function() {
        /* Hide the start screen */
        $("#game-start").hide();
        // sounds.background.play();
        gem.randomize(gameArea);
        // console.log(gameArea.getPoints());
        

        /* Handle the keydown of arrow keys and spacebar */
        $(document).on("keydown", function(event) {
            /* TODO */
            /* Handle the key down */
            let moveNum;
            console.log(currPlayerUsername + " receiving key down ");
            if(event.keyCode == 37){
                currPlayer.move(1);
                moveNum = 1;
            }
            else if(event.keyCode == 38){
                currPlayer.move(2);
                moveNum = 2;
            }
            else if(event.keyCode == 39){
                currPlayer.move(3);
                moveNum = 3;
            }
            else if(event.keyCode == 40){
                currPlayer.move(4);
                moveNum = 4;
            }
            else if(event.keyCode == 32)
                currPlayer.speedUp();
        
            emitMovingPosition(currPlayerUsername, moveNum);
        });

        /* Handle the keyup of arrow keys and spacebar */
        $(document).on("keyup", function(event) {
            /* TODO */
            /* Handle the key up */
            let moveNum;
            console.log(currPlayerUsername + " receiving key down ");
            if(event.keyCode == 37){
                currPlayer.stop(1);
                moveNum = 1;
            }
            else if(event.keyCode == 38){
                currPlayer.stop(2);
                moveNum = 2;
            }
            else if(event.keyCode == 39){
                currPlayer.stop(3);
                moveNum = 3;
            }
            else if(event.keyCode == 40){
                currPlayer.stop(4);
                moveNum = 4;
            }
            else if(event.keyCode == 32)
                currPlayer.slowDown();
            emitStoppingPosition(currPlayerUsername, moveNum);
        });

        /* Start the game */
        requestAnimationFrame(doFrame);
    });

    return {
        addNewRemotePlayer,
        addExistingRemotePlayers,
        moveRemotePlayer,
        setCurrPlayer,
        stopRemotePlayer,
        // removeRemotePlayer,
        getPlayerPosition: () => player.getXY()
    };
})();

export default Game;

     