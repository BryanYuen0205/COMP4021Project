const express = require("express");
const bcrypt = require("bcrypt");
const fs = require("fs");
const session = require("express-session");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { log } = require("console");
const onlineUsers = {};
const players = {};
const waitingPlayers = [];
const currentPlayer = null;
const area = {top: 165, left:60, bottom: 420, right: 800};

// Create the Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Use the 'public' folder to serve static files
app.use(express.static("public"));

// Use the json middleware to parse JSON data
app.use(express.json());

// Use the session middleware to maintain sessions
const chatSession = session({
    secret: "game",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 300000 }
});
app.use(chatSession);


// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

function randomGemColor(){
    const colors = ["green", "red", "yellow", "purple"];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Returns a random position within the specified area
function randomPosition(area) {
    // area: { minX, maxX, minY, maxY }
    const x = area.left + (Math.random() * (area.right - area.left));
    const y = area.top + (Math.random() * (area.bottom - area.top));
    return {x, y};
}

/**
 * Generate random starting positions for projectiles according to specified
 * direction. 
 * Returns spawn locations {x, y} according to provided area.
 */
function generateProjectileSpawn(area, direction) {
    // area: { left: minX, right: maxX, top: minY, bottom: maxY}
    //debug
    let x, y;
    switch (direction) {
        case 0: // left:    spawn maxX, randomY
            x = area.right + 60;
            y = area.top + Math.random() * (area.bottom - area.top);
            break;
        case 1: // up:      spawn randomX, maxY   
            x = area.left + Math.random() * (area.right - area.left);
            y = area.bottom + 60;
            break;
        case 2: // right:   spawn minX, randomY
            x = area.left - 60;
            y = area.top + Math.random() * (area.bottom - area.top);
            break;
        case 3: // down:    spawn randomX, minY
            x = area.left + Math.random() * (area.right - area.left);
            y = area.top - 60;
            break;
        default:
            console.log("Error: generateProjectileCommand() in server.js:")
            console.log("\tInvalid direction provided as argument.")
            x = -1;
            y = -1;
            break;
    }
    // debug
    // console.log("Generating projectile commands:")
    // console.log("\tx: %i", x)
    // console.log("\ty: %i", y)
    // console.log("\tdir: %i", direction)
    return {x, y}
}

function broadcastProjectileCommand(area) {
    const direction = Math.floor(Math.random() * 4); //generate random direction, 0-3
    const spawn = generateProjectileSpawn(area,direction);
    const command = {direction, spawn};
    // console.log("Broadcasting projectile command:");
    // console.log("spawn:", spawn);
    // console.log("dir: %i", direction);
    io.emit("spawnProjectile", command);
}

function scrambleInterval(interval) {
    // deviate interval by a value of +- 20% of the original interval.
    const scrambleBy = (Math.random() * (interval * 0.4)) - (interval * 0.2);
    // console.log("scrambled interval: %i", Math.floor(interval + scrambleBy));
    return Math.floor(interval + scrambleBy);
}

// Handle the /register endpoint
app.post("/register", (req, res) => {
    // Get the JSON data from the body
    console.log("at the register endpoint");
    
    const { username, name, password } = req.body;        
    
    console.log("now im here");
    
    //
    // D. Reading the users.json file
    //
    //
    let users = JSON.parse(fs.readFileSync("data/players.json"));
    // console.log(users);
    // console.log(users[username]);
    // console.log(username in users);
    
    

    // E. Checking for the user data correctness
    if(!username || !name || !password){
        return res.json({status: "error", error: "Fields cannot be empty!"});
    }
    else if(!containWordCharsOnly(username)){
        return res.json({status: "error", error: "Username can only contain underscores, letters or numbers!"});
    }
    else if(username in users){            
        return res.json({status: "error", error: "User already exists!"});
    }
    // G. Adding the new user account
    //
    const hash = bcrypt.hashSync(password, 10);
    users[username] = {name:name, password:hash};
    fs.writeFileSync("data/players.json", JSON.stringify(users, null, " "));
    //
    // H. Saving the users.json file
    //

    //
    // I. Sending a success response to the browser
    //
    res.json({status:"success"});
    // Delete when appropriate
    // res.json({ status: "error", error: "This endpoint is not yet implemented." });
});

    // Handle the /signin endpoint
app.post("/signin", (req, res) => {
    
    // Get the JSON data from the body
    const { username, password } = req.body;

    //
    // D. Reading the users.json file
    //
    let users = JSON.parse(fs.readFileSync("data/players.json"));
    //
    // E. Checking for username/password
    //
    if(!(username in users))
        return res.json({status:"error", error: "User does not exist. Please register for an account!"});
    const hashedPassword = users[username].password;
    if(!bcrypt.compareSync(password, hashedPassword))
        return res.json({status:"error", error: "Incorrect password. Please try again!"});
    
    //
    // G. Sending a success response with the user account
    //
    const user = {username: username, name: users[username].name}
    // console.log(user);
    req.session.user = user;
    res.json({status:"success", user: user});
    // Delete when appropriate
    // res.json({ status: "error", error: "This endpoint is not yet implemented." });
});

// Handle the /validate endpoint
app.get("/validate", (req, res) => { 

    //
    // B. Getting req.session.user
    //
    console.log("At the validate endpoint");
    
    const sessionUser = req.session.user;
    console.log(sessionUser);
    
    //
    // D. Sending a success response with the user account
    //
    if(sessionUser){
        // console.log("server user validated");
        return res.json({status:"success", user:sessionUser});
    }
    // console.log("server no user validated");
    
    res.json({ status: "error", error: "error" });
    // Delete when appropriate
    // res.json({ status: "error", error: "This endpoint is not yet implemented." });
});

    // Handle the /signout endpoint
    app.get("/signout", (req, res) => {
        console.log("At the signout endpoint");
        
        //
        // Deleting req.session.user
        //
        delete req.session.user;
        //
        // Sending a success response
        //
        res.json({status: "success"});
        // Delete when appropriate
        // res.json({ status: "error", error: "This endpoint is not yet implemented." });
    });


io.use((socket, next) => {
    chatSession(socket.request, {}, next);
});

// Enum to avoid magic numbers when changing projectileInterval.
const projectileDifficulty = {
    initial: 350,
    easy: 300,
    medium: 225,
    hard: 150
}
// We need to ensure that the projectile loop only runs once, even if there are 
// two players. Keep track with this variable.
let projectileLoopOn = false;
let difficultyAdjustedRecently = false;
let projectileTimer; 
let projectileDifficultyTimer;
let projectileInterval = projectileDifficulty.initial;

function startProjectileLoop() {
    if (!projectileLoopOn) return;
    broadcastProjectileCommand(area);
    projectileTimer = setTimeout(startProjectileLoop, scrambleInterval(projectileInterval));
}

io.on("connection", (socket) => {
    if(socket.request.session.user){     
        const {username, name} = socket.request.session.user;
        onlineUsers[username] = {name:name};
        players[username] = {x:500, y:240};
        // io.emit("add user", JSON.stringify({username, avatar, name}));
        console.log(onlineUsers);
        
        // Notify all existing clients about the new player 
        // REMOVE if not working 
        io.emit("newPlayer", {username: username, x:427, y: 240});

        socket.on("get players", () => {
            socket.emit("players", onlineUsers);
        });

        socket.on("disconnect", () => {
            delete onlineUsers[socket.request.session.user.username];
            // io.emit("remove user", JSON.stringify({username, avatar, name}));
            // console.log(onlineUsers); 
        });

        // Increases the difficulty of the game. Logic in game.js
        socket.on("raiseProjectileDifficulty",() => {
            if (!difficultyAdjustedRecently) {
                difficultyAdjustedRecently = true;
                projectileDifficultyTimer = setInterval(() => {
                    // Placed inside to see if adjustment won't repeat.
                    switch (projectileInterval) {
                        case projectileDifficulty.initial:
                            projectileInterval = projectileDifficulty.easy;
                            break;
                        case projectileDifficulty.easy:
                            projectileInterval = projectileDifficulty.medium;
                            break;
                        case projectileDifficulty.medium:
                            projectileInterval = projectileDifficulty.hard;
                            break;
                        case projectileDifficulty.hard:
                            break;
                    }
                    // Do not allow updates within 1.5 seconds. This is to avoid double raising
                    // of difficulty in multiplayer mode.
                    console.log("Difficulty adjusted to: " 
                        + Object.keys(projectileDifficulty)
                        .find(key => projectileDifficulty[key] === projectileInterval));
                    difficultyAdjustedRecently = false;
                    clearInterval(projectileDifficultyTimer);
                }, 1500)
            }

        });

        socket.on("startProjectileLoop", () => {
            if (!projectileLoopOn) {
                projectileInterval = projectileDifficulty.initial; // Ensure this is reset at start of game loop.
                projectileLoopOn = true;
                // start broadcasting at approximately `projectileInterval` milliseconds.
                startProjectileLoop();
            }
        });

        socket.on("endProjectileLoop", () => {
            projectileLoopOn = false;
            clearTimeout(projectileTimer);
        });
 
        socket.on("move", (playerAction) => {
            io.emit("playerMove", playerAction);
        });

        socket.on("stop", (playerAction) => {
            io.emit("playerStop", playerAction);
        });

        socket.on("playerSpeedUp", (player) => {
            console.log(player + " is FUCKING SPEEDING");
            io.emit("increaseSpeed", player);
        })

        socket.on("playerSlowDown", (player) => {
            console.log(player + " is FUCKING SLOW");
            io.emit("decreaseSpeed", player);
        })

        socket.on("hitProjectile", (player) => {
            console.log(player + " has collided with a projectile and died.")
            io.emit("killPlayer", player);
        })

        socket.on("getGemAttr", () => {
            const {x,y} = randomPosition(area);
            const gemColor = randomGemColor();
            io.emit("setGemAttr", {
                gemColor: gemColor,
                gemPosition : {x,y}
            });
        })

        socket.on("getBootsPos", () => {
            const {x,y} = randomPosition(area);
            io.emit("setBootsPos", {x,y})
        })

        socket.on("logCollectedGems", ({player, collectedGems}) => {
            console.log("logging collected gems");
            console.log(player);
            console.log(collectedGems);        
            let score = JSON.parse(fs.readFileSync("data/leaderboard.json"));
            score[player] = collectedGems;
            fs.writeFileSync("data/leaderboard.json", JSON.stringify(score, null, " "));
        })

        socket.on("joinMultiplayer", () => {
            if (!waitingPlayers.includes(socket.id)){
                waitingPlayers.push(socket.id);
                socket.emit("prepareMultiplayer")
            } 
            if (waitingPlayers.length >= 2) {
                // socket.emit("gemUpdate");
                const {x,y} = randomPosition(area);
                const bootsPos = randomPosition(area);
                const gemColor = randomGemColor();
                let numWaitingPlayers = waitingPlayers.length;

                console.log("The ran gem col : " + randomGemColor());
                console.log("The ran gem pos : " + x + " " + y);

                waitingPlayers.forEach(id => io.to(id).emit("startGame", {
                    numWaitingPlayers: numWaitingPlayers, 
                    gemColor: gemColor,
                    gemPosition : {x,y},
                    bootsPos : bootsPos,
                }));
                waitingPlayers.length = 0; // reset room
            }
        })
    
        socket.emit("greeting");
    }  
})

// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("The chat server has started...");
});