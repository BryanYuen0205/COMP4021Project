const express = require("express");
const bcrypt = require("bcrypt");
const fs = require("fs");
const session = require("express-session");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { log } = require("console");
const onlineUsers = {};

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
        // io.emit("add user", JSON.stringify({username, avatar, name}));

        socket.on("disconnect", () => {
            delete onlineUsers[socket.request.session.user.username];
            // io.emit("remove user", JSON.stringify({username, avatar, name}));
            // console.log(onlineUsers); 
        }) 
    
        socket.emit("greeting");
    }  

    
})

// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("The chat server has started...");
});