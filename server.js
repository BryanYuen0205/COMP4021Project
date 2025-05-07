const express = require("express");
const bcrypt = require("bcrypt");
const fs = require("fs");
const session = require("express-session");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { log } = require("console");
const onlineUsers = {};
const players = {};
// const waitingPlayers = [];
let waitingPlayers = {};
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
        })

        socket.on("disconnect", () => {
            delete onlineUsers[socket.request.session.user.username];
            // io.emit("remove user", JSON.stringify({username, avatar, name}));
            // console.log(onlineUsers); 
        });
 
        socket.on("move", (playerAction) => {
            io.emit("playerMove", playerAction);
        });

        socket.on("stop", (playerAction) => {
            io.emit("playerStop", playerAction);
        });

        socket.on("playerSpeedUp", (player) => {
            // console.log(player + " is FUCKING SPEEDING");
            io.emit("increaseSpeed", player);
        })

        socket.on("playerSlowDown", (player) => {
            // console.log(player + " is FUCKING SLOW");
            io.emit("decreaseSpeed", player);
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
            // console.log("logging collected gems");
            // console.log(player);
            // console.log(collectedGems);        
            let score = JSON.parse(fs.readFileSync("data/leaderboard.json"));
            score[player] = collectedGems;
            fs.writeFileSync("data/leaderboard.json", JSON.stringify(score, null, " "));
        })

        socket.on("joinMultiplayer", () => {
            console.log(username + " is joining mp");
            
            if(!waitingPlayers[username]){
                // console.log("Adding this guy to waiting list " + username);
                
                waitingPlayers[username] = socket.id;
                
                socket.emit("prepareMultiplayer");
            }
            // Broadcast the updated waiting player count to all waiting players
            let numWaitingPlayers = Object.keys(waitingPlayers).length;
            for (const socketId of Object.values(waitingPlayers)) {
                io.to(socketId).emit("waitingRoomUpdate", { numWaitingPlayers });
            }
            if (Object.keys(waitingPlayers).length >= 2) {
                // io.emit("newPlayer", {username: username, x:427, y: 240});
                // // socket.emit("gemUpdate");
                const {x,y} = randomPosition(area);
                const bootsPos = randomPosition(area);
                const gemColor = randomGemColor();

                for (const [name, socketId] of Object.entries(waitingPlayers)){
                    console.log(name, socketId);

                    // console.log("The ran gem col : " + randomGemColor());
                    // console.log("The ran gem pos : " + x + " " + y);
                    io.to(socketId).emit("startGame", {
                        numWaitingPlayers: numWaitingPlayers, 
                        gemColor: gemColor,
                        gemPosition : {x,y},
                        bootsPos : bootsPos,
                        seshUser: socket.request.session.user
                    })
                }
                waitingPlayers = {};
            }
        })
    
        socket.emit("greeting");
    }  
})

// Use a web server to listen at port 8000
httpServer.listen(8000,  () => {
    console.log("The chat server has started...");
});