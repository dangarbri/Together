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

var MESSAGE_SENDING = "sending..."
var MESSAGE_SENT    = "sent"

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
 * Returns the div for the last message added to the list.
 */
function getLastMessage() {
    var messageList = messages.el.getElementsByClassName("message");
    var lastMessage = messageList[messageList.length-1];
    return lastMessage;
}
  
  // Response flag
  var responseInProgress = false;
  
// Send Message
$$('.send-link').on('click', function () {
    var text = messagebar.getValue().replace(/\n/g, '<br>').trim();
    // return if empty message
    if (!text.length) return;
  
    // Clear area
    messagebar.clear();
  
    // Add message to messages
    messages.addMessage({
      text: text,
      footer: MESSAGE_SENDING
    });
    
    // Get message div that was created
    var messageDiv = getLastMessage();
    // TODO send message to server and mark message as sent
});
  
  // Dummy response
function receiveMessage() {
    responseInProgress = true;

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

    // Hide typing indicator
    messages.hideTyping();

    responseInProgress = false;
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
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};