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

var MESSAGE_SENDING = "sending..."; // Text to show while message is waiting to be sent to server
var MESSAGE_SENT    = "not seen"; // text to show before message is read
var MESSAGE_SEEN    = "seen"; // text to show when message is read by peer
var SERVER_MESSAGE_ENDPOINT  = "http://192.168.0.33/message"; // Endpoint send/receive messages
var SERVER_REGISTER_ENDPOINT = "http://192.168.0.33/device";   // Endpoint to login
var MAX_SAVED_MESSAGES = 100; // Max # of messages to save to device

// TODO remove this, for debug only right now before implementing users
var USERS = {
    Daniel: 1,
    Leah: 3
}

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
var messagebar = f7.messagebar.create({
    el: '.messagebar',
    on: {
        focus: function () {
            gScrollCheck = setInterval(function () {
                messageWindow.scrollTop = messageWindow.scrollHeight;
            }, 200);
        },
        blur: function () {
            clearInterval(gScrollCheck);
        }
    }
});

/**
 * Mark the given html message as sent.
 * Input is the div with class="message"
 */
function markMessageSent(messageDiv) {
    var footer = messageDiv.getElementsByClassName("message-footer")[0];
    footer.textContent = MESSAGE_SENT;
}

/**
 * Mark all "not read" messages as read (by removing the not read element)
 */
function markRead() {
    var footers = document.getElementsByClassName("message-footer");
    while (footers.length > 0) {
        if (footers.length == 1) {
            footers[0].textContent = MESSAGE_SEEN;
            break;
        } else {
            footers[0].remove();
            footers = document.getElementsByClassName("message-footer");
        }
    }
}

/**
 * Returns the div for the last message added to the list.
 */
function getLastMessage() {
    var messageList = messages.el.getElementsByClassName("message");
    var lastMessage = messageList[messageList.length-1];
    return lastMessage;
}

/**
 * Posts message to the server. Once message is posted the div is updated to say "sent"
 * @param messageDiv - div created by adding the message being sent
 * @param text - text to send in the message
 */
function postMessage(messageDiv, text) {
    var encryptedMessage = encryptMesage(text);
    f7.request({
        method: 'POST',
        url: SERVER_MESSAGE_ENDPOINT,
        data: {message: encryptedMessage, to: USERS.Daniel},
        // On success mark the message as sent
        success: function () {
            if (messageDiv) {
                markMessageSent(messageDiv);
            }
        },
        // TODO: add functionality to make user retry sending
        // don't bother manually retrying, could just be no data connection
        error: function (data) {
            console.log(data);
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
    messages.addMessage({
      text: text,
      footer: MESSAGE_SENDING
    });
    saveMessages(serializeMessages());
    
    // Get message div that was created
    var messageDiv = getLastMessage();
    postMessage(messageDiv, text);
});

function displayReceivedMessage(message) {
    // Add received dummy message
    messages.addMessage({
        text: message,
        type: 'received'
        // name: person.name,
        // avatar: person.avatar
    });
    markRead(); // clears "seen"
}

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
        data: {user: USERS.Daniel, token: token},
        // On success mark the message as sent
        success: function () {
            console.log("Device is registered with together server");
        },
        // TODO: add functionality to make user retry sending
        // don't bother manually retrying, could just be no data connection
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
function refreshMessages() {
    f7.request({
        method: 'GET',
        url: SERVER_MESSAGE_ENDPOINT,
        data: {user: USERS.Daniel},
        dataType: 'json',
        // On success mark the message as sent
        success: function (msgs) {
            msgs.forEach(function (message) {
                console.log(message.message);
                var decryptedMessage = decryptMessage(message.message);
                displayReceivedMessage(decryptedMessage);
            });

            saveMessages(serializeMessages());
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
        // alert(JSON.stringify(data));
        if (data.action == "receive") {
            refreshMessages();
        } else if (data.action == "read") {
            markRead();
        }
    });
}

function serializeMessages() {
    var data = [];
    // We only save the last MAX_SAVED_MESSAGES messages.
    // So count backwards from the end of the list.
    var msgIndex = messages.messages.length - MAX_SAVED_MESSAGES;
    if (msgIndex < 0) {
        msgIndex = 0;
    }
    for (var i = msgIndex; (i < messages.messages.length); i++) {
        var msg = messages.messages[i];
        if (!msg.isTitle) {
            var savedData = {
                type: msg.type,
                text: msg.text
            };
            data.push(savedData);
        }
    }
    return data;
}

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
        document.addEventListener('resume', refreshMessages);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        retrieveSavedMessages(function (msgs) {
            for (var i = 0; i < msgs.length; i++) {
                messages.addMessage(msgs[i]);
            }
        })

        // Originally I intended for this to just be a getter
        // But I ended up implementing it to handle all the login stuff.
        // so the callback can run init and the user won't get past
        // everything unless they login and pair with a partner
        Auth.checkLoginStatus(function () {
            setupFCMPlugin();
            encryptorInit();
        });
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};

app.initialize();