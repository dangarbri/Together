var DEBUG = 0;

if (DEBUG) {
    var SERVER_BASE = "http://192.168.0.33";
} else {
    var SERVER_BASE = "https://dangarbri.com"
}

var SERVER_MESSAGE_ENDPOINT  = SERVER_BASE + "/message"; // Endpoint send/receive messages
var SERVER_TYPING_ENDPOINT   = SERVER_BASE + "/message/typing"; // Endpoint send/receive messages
var SERVER_READ_ENDPOINT     = SERVER_BASE + "/message/read"; // Endpoint send/receive messages
var SERVER_REGISTER_ENDPOINT = SERVER_BASE + "/device";  // Endpoint to login
var SERVER_LOGIN_ENDPOINT    = SERVER_BASE + "/login";
var SERVER_LOGOUT_ENDPOINT   = SERVER_BASE + "/logout";
var SERVER_PING_ENDPOINT     = SERVER_BASE + "/device";
var SERVER_PAIRING_ENDPOINT  = SERVER_BASE + "/pair";
var SERVER_LISTS_ENDPOINT    = SERVER_BASE + "/lists";

var ServerApi = {};
(function (api) {
    api.NotifyMessageRead = function () {
        f7.request({
            method: 'POST',
            url: SERVER_READ_ENDPOINT
        });
    }

    api.SendMessage = function (msg, encMessage, encImage) {
        f7.request({
            method: 'POST',
            url: SERVER_MESSAGE_ENDPOINT,
            data: {message: encMessage, image: encImage},
            dataType: 'json',
            // On success mark the message as sent
            success: function (data) {
                console.log("message sent");
                console.log(data);
                if (data.result == 'success') {
                    Messenger.markSent(msg);
                } else {
                    // TODO: Add error handling for message sent failures
                    alert('Authentication error sending message, this shouldnt happen. Please file a bug');
                }
            },
            // TODO: add functionality to make user retry sending
            // don't bother manually retrying, could just be no data connection
            error: function (data) {
                // console.log(JSON.stringify(data.response));
                alert('failed to send message, need to add handling here to let you retry');
            }
        })
    }

    api.GetListItems = function (callback) {
        f7.request({
            method: 'GET',
            url: SERVER_LISTS_ENDPOINT,
            dataType: 'json',
            success: callback
        });
    }

    api.PostListItems = function (listUpdates) {
        f7.request({
            method: 'POST',
            url: SERVER_LISTS_ENDPOINT,
            data: {list: JSON.stringify(listUpdates)},
            error: function (data) {
                alert('Failed to update lists');
            }
        })
    }
})(ServerApi);