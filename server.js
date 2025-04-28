const express = require("express");
const bcrypt = require("bcrypt");
const fs = require("fs");
const session = require("express-session");
const { createServer } = require("http");
const { Server } = require("socket.io");
const onlineUsers = {};

// Create the Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Use the 'public' folder to serve static files
app.use(express.static("public"));

// Use the json middleware to parse JSON data
app.use(express.json());

// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
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

io.on("connection", (socket) => {
    socket.emit("greeting");
})

// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("The chat server has started...");
});