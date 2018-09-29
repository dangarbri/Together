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

function openLink(el) {
    console.log('opening ' + el.href);
    window.open(encodeURI(el.href), '_system');
}

var MAX_SAVED_MESSAGES = 100; // Max # of messages to save to device
var TYPING_TIMEOUT = 5000;
var TYPING_PING_INTERVAL = 3000;

var f7 = new Framework7({
    root: '#app',
    touch: {
        tapHold: true //enable tap hold events
    },
    toast: {
        closeTimeout: 1500,
        closeButton: true,
    },
    routes: [{
        name: 'messages',
        path: '/' + Menu.Pages.MESSAGES,
        url: './index.html',
        pushState: true,
        history: true,
        on: {
            pageInit: loadSavedMessages
        }
    }, {
        name: 'lists',
        path: '/' + Menu.Pages.LISTS,
        url: './lists.html',
        pushState: true,
        history: true,
        on: {
            pageInit: Lists.Initialize
        }
    }]
});

f7.mainView = f7.views.create('.view-main', {url: '/messages'});

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

function toggleCameraButtons() {
    $$(fab_camera).toggleClass('fab-camera-in');
    $$(fab_gallery).toggleClass('fab-gallery-in');
}

var fab_camera  = document.getElementById('js-fab-cam');
var fab_gallery = document.getElementById('js-fab-gal');
// Attachments handling
$$('a.toggle-sheet').on('click', function () {
    toggleCameraButtons();
});

$$(fab_camera).on('click', function () {
    Photos.TakePicture(attachImage);
    toggleCameraButtons();
})

$$(fab_gallery).on('click', function () {
    Photos.SelectPicture(attachImage);
    toggleCameraButtons();
})

// Interval that runs when message bar is focused to try to
// scroll the screen to the bottom
var gScrollCheck;
var gIsTyping = false;
var messagebar = f7.messagebar.create({
    el: '.messagebar',
    attachmentsVisible: true,
    on: {
        keypress: function () {
            pingTyping();
        },
        focus: function () {
            gScrollCheck = setInterval(function () {
                messageWindow.scrollTop = messageWindow.scrollHeight;
            }, 200);
        },
        blur: function () {
            clearInterval(gScrollCheck);
            cancelTyping();
        },
    }
});

  /*========================
    Handle Attachments
    ========================*/
  function checkAttachments() {
    if (messagebar.attachments.length > 0) {
      messagebar.attachmentsShow();
      messagebar.setPlaceholder('Add comment or Send');
    } else {
      messagebar.attachmentsHide();
      messagebar.setPlaceholder('Message');
    }
  }

  function attachImage(uri) {
    messagebar.attachments = [uri];
    messagebar.renderAttachments();
    checkAttachments();
  }

  function clearAttachments() {
    messagebar.attachments = [];
    messagebar.renderAttachments();
    checkAttachments();
  }

  $$('.messagebar-sheet-image input').on('change', function (e) {
    var image = images[index];
    if (e.target.checked) {
      // Add to attachments
      messagebar.attachments.unshift(image)
    } else {
      // Remove from attachments
      messagebar.attachments.splice(messagebar.attachments.indexOf(image), 1);
    }
    messagebar.renderAttachments();
    checkAttachments();
  });

  messagebar.on('attachmentDelete', function (messagebar, attachmentEl, attachmentIndex) {
    var image = messagebar.attachments.splice(attachmentIndex, 1)[0];
    messagebar.renderAttachments();
    checkAttachments();
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
function postMessage(msg, text, image) {
    var encryptedMessage = encryptMesage(text);
    var encryptedImage = null;
    if (image) {
        loadImageData(image, function (data) {
            encryptedImage = encryptMesage(data);
            ServerApi.SendMessage(msg, encryptedMessage, encryptedImage);
        })
    } else {
        ServerApi.SendMessage(msg, encryptedMessage, encryptedImage);
    }
}

  // Response flag
  var responseInProgress = false;

// Send Message
$$('.send-link').on('click', function () {
    var text = messagebar.getValue().replace(/\n/g, '<br>').trim();
    // return if empty message and no picutre
    if (!text.length && (messagebar.attachments.length == 0)) return;

    // Get attachments
    var attachment = null;
    if (messagebar.attachments.length > 0) {
        attachment = messagebar.attachments[0]
    }

    // Add message to messages
    var msg = Messenger.sendMessage(text, attachment);

    messagebar.clear();
    clearAttachments();

    postMessage(msg, text, attachment);
});

/**
 * Registers the device with the server to be able to send
 * messages directly to it.
 * @param token
 */
// TODO should probably have a getter for this but I'm too lazy while prototyping.
var userToken; // READ ONLY variable for other functions to see the current token
function registerDevice(token, cb) {
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
            refreshMessages(true);
            if (cb) {
                cb();
            }
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
        alert("Failed to get device token, app won't work. Tell Daniel FCM Plugin isn't working");
    });
}

/**
 * Request messages from the server
 * Intended to be called when notification is received or app is opened
 * @param[in] notify - Notify other device that message was read
 */
var gTypingTimeout = null;
function refreshMessages(notify) {
    var shouldNotify = notify ? 1 : 0;
    f7.request({
        method: 'GET',
        url: SERVER_MESSAGE_ENDPOINT,
        data: {notify: shouldNotify},
        dataType: 'json',
        // On success mark the message as sent
        success: function (data) {
            var msgs = data.messages;
            if (gTypingTimeout) {
                clearTimeout(gTypingTimeout);
                hideTyping();
            }
            msgs.forEach(function (message) {
                var decryptedMessage = decryptMessage(message.message);
                var image = null;
                if (message.image) {
                    image = decryptMessage(message.image);
                }
                Messenger.receiveMessage(decryptedMessage, message.created_at, image);
            });
            messageWindow.scrollTop = messageWindow.scrollHeight;

            if (data.read) {
                Messenger.markRead();
            }

            // Handle browser stuff
            // if (data.read) {
            //     BrowserMessenger.markRead();
            // }
            // if (msgs.length > 0) {
            //     BrowserMessenger.MessageReceived();
            // }
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
    if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
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
                refreshMessages(true);
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
    } else {
        // BrowserMessenger.Start();
    }
}

/**
 * pingTyping begins the flow where we periodically ping the paired device that we're
 * typing. This ends that.
 */
function cancelTyping() {
    if (gIsTyping) {
        f7.request({
            method: 'POST',
            url: SERVER_TYPING_DONE_ENDPOINT
        });
    }
}

/**
 * Just ping the server's typing endpoint, if we're authenticated it will send
 * a notification to the other user that we're typing
 */
function pingTyping() {
    if (!gIsTyping) {
        gIsTyping = true;
        f7.request({
            method: 'POST',
            url: SERVER_TYPING_ENDPOINT
        });
    }
}

function handleBackButton() {

}

/**
 * Load saved messages on page load
 */
function loadSavedMessages() {
    retrieveSavedMessages(function (msgs) {
        if (msgs) {
            messages.addMessages(msgs, 'append', false);
            Messenger.linkMessages();
            gIsTyping = true;
            cancelTyping();
        }
    })
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
                refreshMessages(true);
            }
        });
        // saveMessages defined in message_manager.js
        document.addEventListener("pause", function () {
            saveMessages(messages.messages);
            cancelTyping();
            Lists.onPause();
        }, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        // loadSavedMessages();

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

        Menu.initialize();
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};

app.initialize();