var SERVER_BASE = "http://192.168.0.33";
// var SERVER_BASE = "https://dangarbri.com"

var SERVER_MESSAGE_ENDPOINT  = SERVER_BASE + "/message"; // Endpoint send/receive messages
var SERVER_TYPING_ENDPOINT  = SERVER_BASE + "/message/typing"; // Endpoint send/receive messages
var SERVER_READ_ENDPOINT  = SERVER_BASE + "/message/read"; // Endpoint send/receive messages
var SERVER_REGISTER_ENDPOINT = SERVER_BASE + "/device";  // Endpoint to login
var SERVER_LOGIN_ENDPOINT  = SERVER_BASE + "/login";
var SERVER_LOGOUT_ENDPOINT = SERVER_BASE + "/logout";
var SERVER_PING_ENDPOINT = SERVER_BASE + "/device";
var SERVER_PAIRING_ENDPOINT = SERVER_BASE + "/pair";

var ServerApi = {};
(function (api) {
    api.NotifyMessageRead = function () {
        f7.request({
            method: 'POST',
            url: SERVER_READ_ENDPOINT
        });
    }
})(ServerApi);