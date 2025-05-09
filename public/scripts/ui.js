const SignInForm = (function() {
    // This function initializes the UI
    const initialize = function() {
        // Populate the avatar selection
        // Avatar.populate($("#register-avatar"));
        
        // Hide it
        $("#signin-overlay").hide();

        // Submit event for the signin form
        $("#signin-form").on("submit", (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $("#signin-username").val().trim();
            const password = $("#signin-password").val().trim();

            // Send a signin request
            Authentication.signin(username, password,
                () => {
                    hide();
                    Menu.show();
                    // UserPanel.update(Authentication.getUser());
                    // UserPanel.show();                    
                    Socket.connect();
                },
                (error) => { $("#signin-message").text(error); }
            );
        });

        // Submit event for the register form
        $("#register-form").on("submit", (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $("#register-username").val().trim();
            // const avatar   = $("#register-avatar").val();
            const name     = $("#register-name").val().trim();
            const password = $("#register-password").val().trim();
            const confirmPassword = $("#register-confirm").val().trim();

            // Password and confirmation does not match
            if (password != confirmPassword) {
                $("#register-message").text("Passwords do not match.");
                return;
            }

            // Send a register request
            Registration.register(username, name, password,
                () => {
                    $("#register-form").get(0).reset();
                    $("#register-message").text("You can sign in now.");
                },
                (error) => { $("#register-message").text(error); }
            );
        });
    };

    // This function shows the form
    const show = function() {
        $("#signin-overlay").fadeIn(500);
    };

    // This function hides the form
    const hide = function() {
        $("#signin-form").get(0).reset();
        $("#signin-message").text("");
        $("#register-message").text("");
        $("#signin-overlay").fadeOut(500);
    };

    return { initialize, show, hide };
})();

const Menu = (function(){
    // Click event for the Single Player button
    const initialize = function(){
        $("#instructions-button").on("click", () => {
            console.log("instructions button clicked bro");
            $("#instructions-overlay").show();
        })

        $('#close-instructions').on("click", () => {
            $("#instructions-overlay").hide();
        })

        $("#singleplayer-button").on("click", () => {
            console.log("sp button clicked bro");
            $("#menu-overlay").hide();
        })
    
        $("#multiplayer-button").on("click", () => {
            console.log("mp button clicked bro");
            $("#menu-overlay").hide();
            $("#game-start").hide();
            $("#waiting-overlay").show();
            const socket = window.Socket.getSocket();
            if(socket){
                socket.emit("joinMultiplayer");
            }
        })
    
        $("#signout-button").on("click", () => {
            console.log("signout button clicked bro");
            Authentication.signout(
                () => {
                    console.log("signing out now");
                    Socket.disconnect();
                    $("#menu-overlay").hide();
                    SignInForm.show();
                }
            )
        })
    };

    const show = function(){
        $("#menu-overlay").show();
    }

    const hide = function(){
        $("#menu-overlay").show();
    }

    // return {initialize,hi};
    return {initialize, show, hide};
})();

const GameOverMenu = (function(){
    // Click event for the Single Player button
    const initialize = function(){
        $("#leaderboard-button").on("click", () => {
            // console.log("Leaderboard button clicked bro");
            $("#leaderboard-overlay").show();
            const socket = window.Socket.getSocket();
            if (socket) {
                socket.emit("getLeaderboard");
            }
        })
        

        $('#close-leaderboard').on("click", () => {
            $("#leaderboard-overlay").hide();
        })

        $('#menu-button').on("click", () => {
            $("#game-over-menu").hide();
            $("#menu-overlay").show()
            // console.log("Menu button clicked bro");
        })

        $('#play-again-button').on("click", () => {
            const socket = window.Socket.getSocket();
            if(socket){
                $("#game-over-menu").hide();
                $("#waiting-overlay").show();
                socket.emit("joinMultiplayer");
            }
        })
    
        $("#game-over-signout-button").on("click", () => {
            console.log("signout button clicked bro");
            Authentication.signout(
                () => {
                    $("#game-over-menu").hide();
                    console.log("signing out now");
                    Socket.disconnect();
                    $("#menu-overlay").hide();
                    SignInForm.show();
                }
            )
        })
    };

    const show = function(){
        $("#game-over-menu").show();
    }

    const hide = function(){
        $("#game-over-menu").hide();
    }

    // return {initialize,hi};
    return {initialize, show, hide};
})();

const UI = (function() {
    // This function gets the user display
    const getUserDisplay = function(user) {
        return $("<div class='field-content row shadow'></div>")
            .append($("<span class='user-avatar'>" +
			        Avatar.getCode(user.avatar) + "</span>"))
            .append($("<span class='user-name'>" + user.name + "</span>"));
    };

    // The components of the UI are put here
    // const components = [SignInForm, UserPanel, OnlineUsersPanel, ChatPanel];
    const components = [SignInForm, Menu, GameOverMenu];

    // This function initializes the UI
    const initialize = function() {
        // Initialize the components
        for (const component of components) {
            component.initialize();
        }
    };

    return { getUserDisplay, initialize };
})();
