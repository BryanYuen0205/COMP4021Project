import Player from './player.js';
import Gem from './gem.js';
import BoundingBox from './bounding_box.js';
import Fire from './fire.js';
import Bomb from './bomb.js';
import Boots from './boots.js';
import Projectile from './projectile.js';

const Game = (function (){
    
/* Get the canvas and 2D context */
    const cv = $("canvas").get(0);
    const context = cv.getContext("2d");

    /* Create the sounds */
    const sounds = {
        background: new Audio("./music/background2.mp3"),
        collect: new Audio("./music/collect.mp3"),
        gameover: new Audio("./music/gameover2.mp3")
    };

    const totalGameTime = 10;   // Total game time in seconds
    const gemMaxAge = 3000;     // The maximum age of the gems in milliseconds
    const bootsMaxAge = 2000;   // The maximum age of the boots in milliseconds
    let currPlayer = null;
    let currPlayerUsername = null;
    let gameStartTime = 0;      // The timestamp when the game starts
    let collectedGems = 0;      // The number of gems collected in the game
    let timeSurvived = 0;       // Time in seconds the user survived for.
    let remotePlayers = {};
    let gemColor, gemPosition, bootsPosition;
    // Keep track of difficulty raises for projectile difficulty.
    let difficultyRaised = [false, false, false];
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
    
    // Queue for spawned projectiles. 
    let projectileQueue = [];

    /* Create the sprites in the game */
    // The Gem
    let gem = Gem(context, 427, 350, "green");        
    
    // The Boots powerup
    let boots = Boots(context, 427, 350);

    const resetGameState = function (){
        console.log("Game is being reset");
        sounds.background.pause();
        gameStartTime = 0;
        collectedGems = 0;
        // remotePlayers = {};
        gem = Gem(context, 427, 350, "green"); 
        boots = Boots(context, 427, 350);
        currPlayer =  Player(context, 427, 240, gameArea);
        for (const [name, socketId] of Object.entries(remotePlayers)){
            remotePlayers[name] = Player(context, 427, 240, gameArea);
        }

        // currPlayer = null;
        // currPlayerUsername = null;
    }

    // add a projectile to the queue.
    // command: {direction, {x, y}}
    const addProjectile = function(command) {
        let {direction, spawn} = command;
        // console.log("Adding projectile at: (%i, %i)", spawn.x, spawn.y);
        projectileQueue.push(Projectile(context, spawn.x, spawn.y, gameArea, direction));
    }
    
    const setGemAttr = function (color, pos){
        // console.log("Setting up gem attributes with " + color + " and " + pos.x + " " + pos.y);
        gemColor = color;
        gemPosition = pos;
        gem.randomize(gemColor, gemPosition)
    }

    const getGemAttr = function (){
        // console.log("Getting gem attributes from server");
        const socket = window.Socket.getSocket();
        if(socket){
            socket.emit("getGemAttr");
        }
    }

    // Function to set up the position of the boots powerup
    const setBoots = function (pos){
        // console.log("Setting the position of the boots");
        bootsPosition = pos;
        boots.randomize(pos);
    }

    // Function to get the position of the boots powerup
    const getBootsPos = function (){
        // console.log("Getting gem attributes from server");
        const socket = window.Socket.getSocket();
        if(socket){
            socket.emit("getBootsPos");
        }
    }

    // Adds new remote players
    const addNewRemotePlayer = function (player){        
        // console.log("Adding new remote player");
        
        if(currPlayer && player.username != currPlayerUsername){
            remotePlayers[player.username] = Player(context, player.x, player.y, gameArea);
        }
        // console.log("The total length is " + Object.keys(remotePlayers).length);
    }

    // Adds existing remote players
    const addExistingRemotePlayers = function (players) {
        // Only add players that are not the current player
        // console.log("Adding existing remote player");

        for (const player in players){
            if(currPlayerUsername != player){
                remotePlayers[player] = Player(context, 427, 240, gameArea);
            }
        }
        // console.log("The total length is " + Object.keys(remotePlayers).length);
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
        else{
            currPlayer.move(playerAction.moveNum);
        }
    }
    
    // This function stops other remote players 
    const stopRemotePlayer = function (playerAction){
        if(remotePlayers[playerAction.player]){
            remotePlayers[playerAction.player].stop(playerAction.moveNum);
        }
        else{
            currPlayer.stop(playerAction.moveNum);
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

    // Emits number of gems collected by current player
    const emitScore = function (){
        // console.log("Emitting collected Gems");
        
        const socket = window.Socket.getSocket();
        if(socket){
            socket.emit("logScore", 
            { 
                player:currPlayerUsername, 
                collectedGems:collectedGems,
                timeSurvived: timeSurvived
            });
        }
    }
    const emitGetWinner = function () {
        const socket = window.Socket.getSocket();
        if (socket){
            socket.emit("getWinner");
        }
    }

    // Increases the player speed 
    const increaseSpeed = function (player){
        // console.log(player + "'s speed increased");
        if(remotePlayers[player]){
            remotePlayers[player].speedUp();
        }
        else{
            currPlayer.speedUp();
        }
    }

    // Emits player speed up 
    const emitSpeedUp = function (){
        const socket = window.Socket.getSocket();
        if(socket){
            socket.emit("playerSpeedUp", currPlayerUsername);
        }
    }

    // Increases the player speed 
    const decreaseSpeed = function (player){
        // console.log(player + "'s speed decreased");
        if(remotePlayers[player]){
            remotePlayers[player].slowDown();
        }
        else{
            currPlayer.slowDown();
        }
    }

    // Emits player speed up 
    const emitSlowDown = function (){
        const socket = window.Socket.getSocket();
        if(socket){
            socket.emit("playerSlowDown", currPlayerUsername);
        }
    }
    // Let server know this session's player has collided with a projectile
    const emitHitProjectile = function() {
        const socket = window.Socket.getSocket();
        if(socket) {
            socket.emit("hitProjectile", currPlayerUsername);
        }
    }
    // Kill player.
    const killPlayer = function(player) {
        console.log(player + " has died.");
        sounds.gameover.play();
        if (remotePlayers[player]) {
            remotePlayers[player].die();
        } else {
            currPlayer.die();
        }
    }
    
    // Initiate the randomized projectile spawn loop on the server side.
    // Server should only run one randomized spawn loop, so make sure it doesn't
    // run twice for some reason.
    // This function should run in startGame().
    const emitStartProjectileLoop = function() {
        const socket = window.Socket.getSocket();
        if(socket) {
            socket.emit("startProjectileLoop");
        }
    }

    // End projectile loop on serverside. 
    // Should run when the game is over for both players.
    const emitEndProjectileLoop = function() {
        const socket = window.Socket.getSocket();
        if (socket) {
            socket.emit("endProjectileLoop");
        }
    }

    // Emit message to server to increase the frequency of projectile spawn.
    const emitRaiseProjectileDifficulty = function() {
        const socket = window.Socket.getSocket();
        if (socket) {
            socket.emit("raiseProjectileDifficulty");
        }
    }
    

    // Function to start the game
    const startGame = function (){
        /* Hide the start screen */

        projectileQueue = [];
        $("#game-start").hide();
        sounds.background.play();
        sounds.background.volume = 0.05;
        // gem.randomize(gameArea);
        gem.randomize(gemColor, gemPosition);
        boots.randomize(bootsPosition);
        emitStartProjectileLoop();
        // console.log(gameArea.getPoints());
        
        $(document).off("keydown");
        $(document).off("keyup");
        /* Handle the keydown of arrow keys and spacebar */
        $(document).on("keydown", function(event) {
            /* TODO */
            /* Handle the key down */
            let moveNum;
            // console.log(currPlayerUsername + " receiving key down ");
            if(event.keyCode == 37){
                // currPlayer.move(1);
                moveNum = 1;
            }
            else if(event.keyCode == 38){
                // currPlayer.move(2);
                moveNum = 2;
            }
            else if(event.keyCode == 39){
                // currPlayer.move(3);
                moveNum = 3;
            }
            else if(event.keyCode == 40){
                // currPlayer.move(4);
                moveNum = 4;
            }
            else if(event.keyCode == 32){
                // currPlayer.speedUp();
                emitSpeedUp();
            }
        
            emitMovingPosition(currPlayerUsername, moveNum);
        });

        /* Handle the keyup of arrow keys and spacebar */
        $(document).on("keyup", function(event) {
            /* TODO */
            /* Handle the key up */
            let moveNum;
            // console.log(currPlayerUsername + " receiving key down ");
            if(event.keyCode == 37){
                // currPlayer.stop(1);
                moveNum = 1;
            }
            else if(event.keyCode == 38){
                // currPlayer.stop(2);
                moveNum = 2;
            }
            else if(event.keyCode == 39){
                // currPlayer.stop(3);
                moveNum = 3;
            }
            else if(event.keyCode == 40){
                // currPlayer.stop(4);
                moveNum = 4;
            }
            else if(event.keyCode == 32){
                emitSlowDown();
                // currPlayer.slowDown();
            }
            emitStoppingPosition(currPlayerUsername, moveNum);
        });

        /* Start the game */
        requestAnimationFrame(doFrame);
    }


    /* The main processing of the game */
    function doFrame(now) {
        if (gameStartTime == 0) gameStartTime = now;

        /* Update the time remaining */
        const gameTimeSoFar = now - gameStartTime;
        const timeRemaining = Math.ceil((totalGameTime * 1000 - gameTimeSoFar) / 1000);
        $("#time-remaining").text(timeRemaining);


        // Yes... this will cause the game to send 60 ish emits to the server, but it is 
        // handled on the server via a setTimeout and a difficultyAdjustedRecently variable.
        // Raise difficulty to easy
        if(timeRemaining == Math.ceil(totalGameTime * 0.9) && !difficultyRaised[0]) {
            difficultyRaised[0] = true;
            emitRaiseProjectileDifficulty();
        }
        // raise difficulty to medium
        if(timeRemaining == Math.ceil(totalGameTime * 0.6) && !difficultyRaised[1]) {
            difficultyRaised[1] = true;
            emitRaiseProjectileDifficulty();
        }
        // raise difficulty to hard
        if(timeRemaining == Math.ceil(totalGameTime * 0.3) && !difficultyRaised[2]) {
            difficultyRaised[2] = true;
            emitRaiseProjectileDifficulty();
        }

        let playerIsDead = currPlayer.getCondition();
        /* TODO */
        /* Handle the game over situation here */
        if(timeRemaining == 0){
            // If not dead by the end, then time survived is total game time.
            if (!playerIsDead) timeSurvived = totalGameTime;
            $("#game-over").show();
            $("#time-survived").html(timeSurvived);
            $("#final-gems").html(collectedGems);
            // add time survived id to html.
            // Only emit the score if the player hasn't died already.
            if(!currPlayer.getCondition()) emitScore();
            emitEndProjectileLoop();
            emitGetWinner();
            resetGameState();
            // $(document).off("keydown");
            // $(document).off("keyup");
            // reset game state.
            for (let i = 0; i < difficultyRaised.length; i++) {
                difficultyRaised[i] = false;
            }
            // sounds.background.pause();
            // sounds.collect.pause();
            // sounds.gameover.play();
            return;
        }
        // Handle game over for all players dead:
        if(playerIsDead) {
            for(let remotePlayer in remotePlayers) {
                // Should only be one remote player...
                if (remotePlayers[remotePlayer].getCondition()) {
                    $("#game-over").show();
                    $("#time-survived").html(timeSurvived);
                    $("#final-gems").html(collectedGems);
                    // Once again, add time survived to end game screen.
                    emitEndProjectileLoop();
                    emitGetWinner();
                    resetGameState();
                    // reset game state.
                    for (let i = 0; i < difficultyRaised.length; i++) {
                        difficultyRaised[i] = false;
                    }
                    return;

                }
            }
            // sounds.background.pause();
        }

        /* Update the sprites */
        gem.update(now);
        boots.update(now);
        currPlayer.update(now);

        for(let i = 0; i < fires.length; i++)
            fires[i].update(now);
        for(let i = 0; i < bombs.length; i++)
            bombs[i].update(now);
        for(const projectile of projectileQueue) {
            //console.log("updating projectiles...");
            projectile.update(now);
            let oldestXY = projectileQueue[0].getXY();
            // console.log("Oldest X, Y: (%i, %i)", oldestXY.x, oldestXY.y);
            if(oldestXY.x < 0 || oldestXY.x > 860 || oldestXY.y < 0 || oldestXY.y > 480) {
                projectileQueue.shift();
                // console.log("Number of projectiles: %i", projectileQueue.length);
            }
        }


        /* TODO */
        /* Randomize the gem and collect the gem here */
        if(gem.getAge(now) >= gemMaxAge){
            // Get new gem color and position
            // gem.randomize(gameArea);
            getGemAttr();
            // gem.randomize(gemColor, gemPosition);
        }

        if(boots.getAge(now) >= bootsMaxAge){       
            getBootsPos();
        }

        let playerBoundingBox = currPlayer.getBoundingBox();
        let gemPos = gem.getXY();       
        let boostPos = boots.getXY();
        
        // Death logic for collision with projectile.
        if(!playerIsDead) {
            console.log("player is not yet dead");
            for(const projectile of projectileQueue) {
                let projBB = projectile.getBoundingBox();
                if (playerBoundingBox.intersect(projBB)) {
                    console.log("myPlayer has hit a projectile");
                    // currPlayer.die() executes after server notifies all players
                    // This also emits the current player's score.
                    emitHitProjectile();
                    timeSurvived = totalGameTime - timeRemaining;
                    emitScore();
                    break;
                }
            }
        }
        
        if(playerBoundingBox.isPointInBox(gemPos.x, gemPos.y) && !playerIsDead){
            collectedGems++;
            getGemAttr();
            
            // console.log(collectedGems);
            // sounds.collect.play();
        }

        if(playerBoundingBox.isPointInBox(boostPos.x, boostPos.y)){
            // console.log("Collected boots powerup");
            getBootsPos();
            // sounds.collect.play();
            emitSpeedUp()
            setTimeout(emitSlowDown, 500);
        }

        /* Clear the screen */
        context.clearRect(0, 0, cv.width, cv.height);

        /* Draw the sprites */
        gem.draw();
        boots.draw();
        currPlayer.draw();

        for (let username in remotePlayers){
            remotePlayers[username].update(now);
            remotePlayers[username].draw();
        }

        for(let i = 0; i < fires.length; i++)
            fires[i].draw();
        for(let i = 0; i < bombs.length; i++)
            bombs[i].draw(now);
        for(let i = 0; i < projectileQueue.length; i++)
            projectileQueue[i].draw(now);

        /* Process the next frame */
        requestAnimationFrame(doFrame);
    }

    /* Handle the start of the game */
    $("#game-start").on("click", function() {
        startGame();
    });

    // Handle the end of the game
    $("#game-over").on("click", () => {
        $("#game-over").hide();
        $("#game-over-menu").show();
    })

    return {
        addNewRemotePlayer,
        addExistingRemotePlayers,
        moveRemotePlayer,
        setCurrPlayer,
        stopRemotePlayer,
        startGame,
        setGemAttr,
        setBoots,
        increaseSpeed,
        decreaseSpeed,
        addProjectile,
        killPlayer,
        // removeRemotePlayer,
        getPlayerPosition: () => player.getXY()
    };
})();

export default Game;

     