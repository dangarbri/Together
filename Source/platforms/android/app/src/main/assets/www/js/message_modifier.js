var Messenger = {};
(function (m) {

    var SENT_TEXT = "sent at";
    var READ_TEXT = "read at";
    var SENDING_TEXT = "sending..."; // Text to show while message is waiting to be sent to server
    /**
     * Get the date in the format I want it
     */
    function getDateString() {
        var now = new Date();
        var month = now.getMonth() + 1;
        var day = now.getDate();
        var hours = now.getHours();
        // Set hours to 12 based instead of 24 hours based
        var ampm = "am"
        if (hours > 12) {
            hours = hours - 12;
            ampm = "pm";
        }
        var minutes = now.getMinutes();
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        return hours + ":" + minutes + " " + ampm;
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
     * Sets timestamp for message sent
     * @param messageDiv - message div created by add message
     */
    m.setSentTimestamp = function (messageDiv) {
        var container = messageDiv.getElementsByClassName('message-footer')[0];
        container.textContent = SENT_TEXT + " " + getDateString();
    }

    /**
     * Update timestamp for when message is read
     * @param footer - footer div to update
     */
    m.setReadTimestamp = function (footer) {
        if (footer.textContent.indexOf(SENT_TEXT) >= 0) {
            footer.textContent = READ_TEXT + " " + getDateString();
        }
    }

    /**
     * Generic function to add a message
     */
    function addMessage(type, text) {
        var options = {
            type: type,
            text: text
        };
        if (type === 'sent') {
            options.footer = SENDING_TEXT;
        }
        messages.addMessage(options);
        var lastMessage = messages.messages[messages.messages.length - 1];
        lastMessage.div = getLastMessage();
        return lastMessage;
    }

    /**
     * Send a message (Adds to screen)
     */
    m.sendMessage = function (message) {
        return addMessage('sent', message);
    }

    /**
     * Receive a message (Adds to screen)
     */
    m.receiveMessage = function (message) {
        return addMessage('received', message);
    }

})(Messenger)