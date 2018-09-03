var Auth = {};
(function (api) {
    api.loginCallback = null; // Function to call once user is logged in
    api.pairing = null;
    api.statusCheck = null;
    api.loader = null;
    api.pairingCode = "(loading...)"

    api.register = function () {

    }

    api.login = function () {
        // alert("logging in");
        var loginEl = document.getElementById('js-login');
        api.loginScreen = f7.loginScreen.create({el: loginEl});
        api.loginScreen.open(true);

        var submit = document.getElementById('js-login-button');
        submit.addEventListener('click', api.sendLogin);
    }

    api.logout = function () {
        if (f7 == null) {
            alert("Attempted to send logout command without initializing");
            return;
        }

        f7.request({
            method: 'GET',
            url: SERVER_LOGOUT_ENDPOINT
        });
    }

    /**
     * Ping the server to check if user is logged in
     * runs the callback with true if user is logged in, false if not
     */
    api.checkLoginStatus = function (cb) {
        if (cb) {
            api.loginCallback = cb;
        }
        f7.request({
            method: 'GET',
            url: SERVER_PING_ENDPOINT,
            dataType: 'json',
            // On success mark the message as sent
            // TODO clean this up... it's a bunch of different things that
            // happen based on being logged in vs being paired
            success: function (data) {
                // alert(JSON.stringify(data));
                // if not logged in, request login
                if (!data.loggedIn) {
                    api.login();
                    return; // end here
                } else {
                    // We're logged in. Close login screen
                    if (api.loginScreen) {
                        api.loginScreen.close();
                    }
                }
                // If logged in but not paired, enter pairing mode
                if (data.loggedIn && !data.paired) {
                    if (!api.pairing) {
                        api.requestPairingKey();
                    } else {
                        // Wait 5 seconds and then check status again
                        // to see if we're paired
                        api.statusCheck = setTimeout(api.checkLoginStatus, 5000);
                    }
                    return; // end here
                } else {
                    // we're logged in and paired. So we're done
                    if (api.pairing && api.pairing.opened) {
                        api.pairing.close();
                    }
                    if (api.loader && api.loader.opened) {
                        api.loader.close();
                    }
                    if (api.loginCallback) {
                        api.loginCallback();
                    }
                }
            },
            error: function (data) {
                alert("login failed");
                console.log(data);
            }
        })
    }

    /**
     * Send login credentials to server
     */
    api.sendLogin = function () {
        var username = document.getElementById('js-username').value;
        var password = document.getElementById('js-password').value;

        f7.request({
            method: 'POST',
            url: SERVER_LOGIN_ENDPOINT,
            data: {email: username, password: password},
            dataType: 'json',
            // On success mark the message as sent
            success: function (data) {
                api.checkLoginStatus();
            },
            // TODO: add functionality to make user retry sending
            // don't bother manually retrying, could just be no data connection
            error: function (data) {
                alert("login failed");
                console.log(data);
            }
        })
    }

    function openPairingDialog() {
        api.pairing = f7.dialog.prompt("<p>Your code is <span id='js-pairing-code'>" + api.pairingCode + "</span></p>" +
                                      "<p>Enter's partner code and have them enter yours</p>",
        "Pair with Partner",
        function (pairingCode) {
            api.postPairingCode(pairingCode);
        },
        function () {
            var code = document.getElementById('js-pairing-code');
            openPairingDialog();
        });
    }

    api.requestPairingKey = function () {
        openPairingDialog();

        f7.request({
            method: 'GET',
            url: SERVER_PAIRING_ENDPOINT,
            dataType: 'json',
            // On success mark the message as sent
            success: function (data) {
                var codeElement = document.getElementById('js-pairing-code');
                codeElement.textContent=data.pairing_code;
                api.pairingCode = data.pairing_code;
            },
            // TODO: add functionality to make user retry sending
            // don't bother manually retrying, could just be no data connection
            error: function (data) {
                alert("Failed to retrieve pairing code");
                console.log(data);
            }
        })
        // Begin login status check loop
        api.checkLoginStatus();
    }

    api.postPairingCode = function (pairingCode) {
        api.loader = f7.dialog.preloader("Pairing");
        f7.request({
            method: 'POST',
            url: SERVER_PAIRING_ENDPOINT,
            data: {code: pairingCode},
            dataType: 'json',
            // On success mark the message as sent
            success: function (data) {
                if (data.success) {
                    // Great we're logged in. Now just wait for the pending status checks to go through
                } else {
                    // Pairing failed, go back to pairing window
                    api.loader.close();
                    // Request pairing key to open pairing dialog again
                    openPairingDialog();
                }
            },
            // TODO: add functionality to make user retry sending
            // don't bother manually retrying, could just be no data connection
            error: function (data) {
                alert("Pairing failed");
                console.log(data);
            }
        })
    }   

})(Auth);