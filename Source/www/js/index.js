/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
// var f7 = new Framework7({
//     // App root element
//     root: '#app',
//     // App Name
//     name: 'Together',
//     // App id
//     id: 'com.dangarbri.together',
//     // Enable swipe panel
//     panel: {
//       swipe: 'left',
//     },
//     // Add default routes
//     routes: [
//       {
//         // path: '/about/',
//         // url: 'about.html',
//       },
//     ],
//     // ... other parameters
//   });

/** // API ITEMS TO REMEMBER
    // Show typing indicator
    messages.showTyping({
        header: person.name + ' is typing',
        avatar: person.avatar
    });

    // Add received dummy message
    messages.addMessage({
        text: answer,
        type: 'received',
        name: person.name,
        avatar: person.avatar
    });

 */

var MAX_SAVED_MESSAGES = 100; // Max # of messages to save to device
var TYPING_TIMEOUT = 5000;
var TYPING_PING_INTERVAL = 3000;

var f7 = new Framework7({
    root: '#app'
});

var mainView = f7.views.create('.view-main');

var $$ = Dom7;

var messageWindow = document.getElementById("js-message-window");

// Init Messages
var messages = f7.messages.create({
    el: '.messages',

    // First message rule
    firstMessageRule: function (message, previousMessage, nextMessage) {
      // Skip if title
      if (message.isTitle) return false;
      /* if:
        - there is no previous message
        - or previous message type (send/received) is different
        - or previous message sender name is different
      */
      if (!previousMessage || previousMessage.type !== message.type || previousMessage.name !== message.name) return true;
      return false;
    },
    // Last message rule
    lastMessageRule: function (message, previousMessage, nextMessage) {
      // Skip if title
      if (message.isTitle) return false;
      /* if:
        - there is no next message
        - or next message type (send/received) is different
        - or next message sender name is different
      */
      if (!nextMessage || nextMessage.type !== message.type || nextMessage.name !== message.name) return true;
      return false;
    },
    // Last message rule
    tailMessageRule: function (message, previousMessage, nextMessage) {
      // Skip if title
      if (message.isTitle) return false;
        /* if (bascially same as lastMessageRule):
        - there is no next message
        - or next message type (send/received) is different
        - or next message sender name is different
      */
      if (!nextMessage || nextMessage.type !== message.type || nextMessage.name !== message.name) return true;
      return false;
    }
});

// Interval that runs when message bar is focused to try to
// scroll the screen to the bottom
var gScrollCheck;
var gIsTyping = false;
var messagebar = f7.messagebar.create({
    el: '.messagebar',
    on: {
        focus: function () {
            gScrollCheck = setInterval(function () {
                messageWindow.scrollTop = messageWindow.scrollHeight;
            }, 200);
            pingTyping();
            gIsTyping = true;
        },
        blur: function () {
            clearInterval(gScrollCheck);
            gIsTyping = false;
        },
    }
});

var gAreTheyTyping = false;
function showTyping() {
    if (!gAreTheyTyping) {
        messages.showTyping();
        gAreTheyTyping = true;
    }
}

function hideTyping() {
    if (gAreTheyTyping) {
        gAreTheyTyping = false;
        messages.hideTyping();
    }
}

/**
 * Posts message to the server. Once message is posted the div is updated to say "sent"
 * @param msg - message object returned by send/receiveMessage
 * @param text - text to send in the message
 */
function postMessage(msg, text) {
    var encryptedMessage = encryptMesage(text);
    f7.request({
        method: 'POST',
        url: SERVER_MESSAGE_ENDPOINT,
        data: {message: encryptedMessage},
        dataType: 'json',
        // On success mark the message as sent
        success: function (data) {
            console.log("message sent");
            console.log(data);
            if (data.result == 'success') {
                Messenger.markSent(msg);
            } else {
                // TODO: Add error handling for message sent failures
                alert('Authentication error, this shouldnt happen. Please file a bug');
            }
        },
        // TODO: add functionality to make user retry sending
        // don't bother manually retrying, could just be no data connection
        error: function (data) {
            alert('failed to send message, need to add handling here to let you retry');
        }
    })
}

  // Response flag
  var responseInProgress = false;

// Send Message
$$('.send-link').on('click', function () {
    var text = messagebar.getValue().replace(/\n/g, '<br>').trim();
    // return if empty message
    if (!text.length) return;

    // TODO: Get last message and remove the message from it
    // so every single message doesn't say "sent"

    // Clear area
    messagebar.clear();

    // Add message to messages
    var msg = Messenger.sendMessage(text);
    postMessage(msg, text);
});

/**
 * Registers the device with the server to be able to send
 * messages directly to it.
 * @param token
 */
// TODO should probably have a getter for this but I'm too lazy while prototyping.
var userToken; // READ ONLY variable for other functions to see the current token
function registerDevice(token) {
    console.log("Registering device with together servers");
    // Set token we're registering with
    userToken = token;
    f7.request({
        method: 'POST',
        url: SERVER_REGISTER_ENDPOINT,
        data: {token: token},
        // On success mark the message as sent
        success: function () {
            console.log("Device is registered with together server");
            // Refresh messages after we've registered the device
            // May not need this but idk
            refreshMessages();
        },
        error: function (request) {
            console.log(request.status);
            console.log(request.statusText);
            console.log(request.responseText);
            alert("Failed to register device on server, tell Daniel it's broken");
        }
    })
}

function setupToken() {
    // I'm not sure how tokens work, so I'm going with we try to get it
    // Then documentation says this may return null if there's no token yet.
    // So I'm going to check if the token is null, and if it is, then we'll set a timer
    // to fire to check it again.
    FCMPlugin.getToken(function(token) {
        if (!token) {
            setTimeout(setupToken, 500);
        } else {
            registerDevice(token);
        }
    }, function (err) {
        console.log("Failed to get device token, app won't work. Tell Daniel FCM Plugin isn't working");
    });
}

/**
 * Request messages from the server
 * Intended to be called when notification is received or app is opened
 */
var gTypingTimeout = null;
function refreshMessages() {
    f7.request({
        method: 'GET',
        url: SERVER_MESSAGE_ENDPOINT,
        dataType: 'json',
        // On success mark the message as sent
        success: function (msgs) {
            if (gTypingTimeout) {
                clearTimeout(gTypingTimeout);
                hideTyping();
            }
            msgs.forEach(function (message) {
                var decryptedMessage = decryptMessage(message.message);
                Messenger.receiveMessage(decryptedMessage, message.created_at);
            });
            messageWindow.scrollTop = messageWindow.scrollHeight;
        },
        // TODO: add functionality to make user retry sending
        // don't bother manually retrying, could just be no data connection
        error: function (request) {
            console.log(request.status);
            console.log(request.statusText);
            console.log(request.responseText);
            alert("Failed to retrieve message");
        }
    })
}

/**
 * Sets up the firebase cloud messaging listener
 * This will respond when a message is received
 */
function setupFCMPlugin() {
    FCMPlugin.onTokenRefresh(function(token) {
        if (token != userToken) {
            registerDevice(token);
        }
    });

    setupToken();

    // Here you define your application behaviour based on the notification data.
    // TODO display message content
    FCMPlugin.onNotification(function(data){
        console.log(JSON.stringify(data));
        // alert("Message received, see console");
        // alert(JSON.stringify(data));
        if (data.action == "receive") {
            refreshMessages();
        } else if (data.action == "read") {
            Messenger.markRead();
        } else if (data.action == "typing") {
            showTyping();
            if (gTypingTimeout) {
                clearTimeout(gTypingTimeout);
            }
            gTypingTimeout = setTimeout(function () {
                hideTyping();
            }, TYPING_TIMEOUT); // Hide typing after ~7.5 seconds, or if a message was received
        }
    });
}

/**
 * Just ping the server's typing endpoint, if we're authenticated it will send
 * a notification to the other user that we're typing
 */
var gPingTimeout = null;
function pingTyping() {
    f7.request({
        method: 'POST',
        url: SERVER_TYPING_ENDPOINT
    })
    if (gPingTimeout) {
        clearTimeout(gPingTimeout);
    }
    // if still typing after 5 seconds, ping again
    gPingTimeout = setTimeout(function () {
        if (gIsTyping) {
            pingTyping();
        }
    }, TYPING_PING_INTERVAL)
}

var gIsInitialized = false;
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('resume', function () {
            if (gIsInitialized) {
                refreshMessages();
            }
        });
        // saveMessages defined in message_manager.js
        document.addEventListener("pause", function () {
            saveMessages(messages.messages);
        }, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        retrieveSavedMessages(function (msgs) {
            messages.addMessages(msgs, 'append', false);
        })

        // Originally I intended for this to just be a getter
        // But I ended up implementing it to handle all the login stuff.
        // so the callback can run init and the user won't get past
        // everything unless they login and pair with a partner
        Auth.checkLoginStatus(function () {
            // alert("Login callback called");
            setupFCMPlugin();
            encryptorInit();
            gIsInitialized = true;
        });
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};

app.initialize();