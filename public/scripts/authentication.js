import Game from './game.js';

const Authentication = (function() {
    // This stores the current signed-in user
    let user = null;

    // This function gets the signed-in user
    const getUser = function() {
        return user;
    }

    // This function sends a sign-in request to the server
    // * `username`  - The username for the sign-in
    // * `password`  - The password of the user
    // * `onSuccess` - This is a callback function to be called when the
    //                 request is successful in this form `onSuccess()`
    // * `onError`   - This is a callback function to be called when the
    //                 request fails in this form `onError(error)`
    const signin = function(username, password, onSuccess, onError) {

        //
        // A. Preparing the user data
        //
        const preparedData = JSON.stringify({username:username, password:password});
        //
        // B. Sending the AJAX request to the server        
        //
        fetch("/signin", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: preparedData
        })
        .then((response) => {return response.json()})
        .then((json) => {
            if(json.status == "success") {
                user = json.user;
                console.log("Signing in the user " + user.username);
                onSuccess();
                Game.setCurrPlayer(user);
            }
            else if(onError) onError(json.error);})
        .catch((err) => {console.log(err)})
        //
        // F. Processing any error returned by the server
        //

        //
        // H. Handling the success response from the server
        //

        // Delete when appropriate
        // if (onError) onError("This function is not yet implemented.");
    };

    // This function sends a validate request to the server
    // * `onSuccess` - This is a callback function to be called when the
    //                 request is successful in this form `onSuccess()`
    // * `onError`   - This is a callback function to be called when the
    //                 request fails in this form `onError(error)`
    const validate = function(onSuccess, onError) {

        //
        // A. Sending the AJAX request to the server
        //
        fetch("/validate")
        .then((response) => response.json())
        .then((json) => {
            if(json.status == "success"){
                console.log("client user validated");
                user = json.user;
                onSuccess();
                Game.setCurrPlayer(user);
            }
            else if(onError){
                console.log("client no user validated");
                onError(json.error);
            }            
        })
        .catch((error) => console.log(error))
        //
        // C. Processing any error returned by the server
        //

        //
        // E. Handling the success response from the server
        //

        // Delete when appropriate
        // if (onError) onError("This function is not yet implemented.");
    };

    // This function sends a sign-out request to the server
    // * `onSuccess` - This is a callback function to be called when the
    //                 request is successful in this form `onSuccess()`
    // * `onError`   - This is a callback function to be called when the
    //                 request fails in this form `onError(error)`
    const signout = function(onSuccess, onError) {

        // Delete when appropriate
        fetch("/signout")
        .then((response) => response.json())
        .then((json) => {
            if(json.status == "success"){
                console.log("im here bro");
                
                user = null;                
                onSuccess();
            }
            else if (onError)
                onError(json.error);
        })
        .catch((error) => console.log(error))
        // if (onError) onError("This function is not yet implemented.");
    };

    return { getUser, signin, validate, signout };
})();

window.Authentication = Authentication;
