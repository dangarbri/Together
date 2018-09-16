var Messenger = {};
(function (m) {
    /**
     * I've modified framework7's message object to have some more info
     * msg object:
     *   type - included: sent/received
     *   text - included: message body
     *   id   - id of the elemend, so you can get the div with js-<id>
     *   status - status of the message, can be sent, read
     */

    var SENT_TEXT = "";
    var UNREAD_TEXT = "not seen";
    var READ_TEXT = "read";
    var SENDING_TEXT = "sending..."; // Text to show while message is waiting to be sent to server
    var STATUS_SENT = 'sent';
    var STATUS_READ = 'read';
    var TYPE_SENT = "sent";
    var TYPE_RECEIVED = "received";
    var CLIPBOARD_SUCCESS = "Message copied";
    var CLIPBOARD_FAILURE = "Error copying message, please try again";

    /**
     * Get the date in the format I want it
     */
    function getDateString(date) {
        if (!date) {
            date = new Date();
        }
        var now = date;
        var month = now.getMonth() + 1;
        var day = now.getDate();
        var hours = now.getHours();
        // Set hours to 12 based instead of 24 hours based
        var ampm = "AM"
        if (hours > 12) {
            hours = hours - 12;
            ampm = "PM";
        }
        var minutes = now.getMinutes();
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        return hours + ":" + minutes + " " + ampm;
    }

    /**
     * Returns the message div for the given message id
     * @param  id - message ID
     */
    function getMessageDiv(id) {
        return document.getElementById('js-' + id);
    }

    /**
     * Clears the footer of the message object
     * @param msg - message object
     */
    function clearFooter(msg) {
        var div = getMessageDiv(msg.id);
        if (div) {
            var readMessage = document.getElementsByClassName('message-footer');
            if (readMessage.length > 0) {
                readMessage[0].remove();
                msg.footer = null;
            }
        }
    }

    /**
     * Update the footer for the given message
     * @param msg - message object
     * @param text - text to show in the footer
     */
    function updateFooter(msg, text) {
        var div = getMessageDiv(msg.id);
        msg.footer = text;
        var footer = div.getElementsByClassName('message-footer');
        // Footer already exists update it
        if (footer.length > 0) {
            footer[0].textContent = msg.footer;
        } else {
            // No footer, create it
            var footerDiv = document.createElement('div');
            footerDiv.className = 'message-footer'
            footerDiv.textContent = msg.footer;
            div.getElementsByClassName('message-content')[0].appendChild(footerDiv);
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
     * Mark the message as sent. Sets the sent timestamp in the message body
     * @param msg - message object returned by addMessage
     */
    m.markSent = function (msg) {
        var div = getMessageDiv(msg.id);
        msg.textFooter = SENT_TEXT + getDateString();
        var textFooter = div.getElementsByClassName('message-text-footer')[0];
        textFooter.textContent = msg.textFooter;
        msg.status = STATUS_SENT;
        updateFooter(msg, UNREAD_TEXT);
    }

    /**
     * Update read for all messages timestamp for all messages
     * @param clearRead
     */
    m.markRead = function (clearRead) {
        // Traverse messages backwards since we only need to update the latest ones
        var lastReadMarked = false; // Only the last message will be marked read, the rest are implied
        for (var i = messages.messages.length - 1; i >= 0; i--) {
            var msg = messages.messages[i];
            if (msg.type == TYPE_SENT && msg.status == STATUS_READ) {
                // Once we've reached the last read message we're done updating
                // so just clear the marking on this one and we're done
                // but only clear it if we've marked a new one as read, otherwise this one
                // still needs to say read
                if (lastReadMarked) {
                    clearFooter(msg);
                }
                break;
            } else if (msg.type == TYPE_SENT && msg.status != STATUS_READ) {
                // status is sent. Mark it as read and set
                msg.status = STATUS_READ;
                if (!lastReadMarked) {
                    var div = getMessageDiv(msg.id);
                    if (div) {
                        updateFooter(msg, READ_TEXT);
                    }
                    lastReadMarked = true;
                } else {
                    // clear footer on all the remaining unseen messages
                    clearFooter(msg);
                }
            }
        }
    }

    function setupCopyListener(msg) {
        // var div = getMessageDiv(msg.id);
        // $$(div).on('taphold', function () {
        //     var result = community.clipboard.setText(msg.text);
        //     if (result != -1) {
        //         f7.toast.create({
        //             text: CLIPBOARD_SUCCESS,
        //             destroyOnClose: true
        //         });
        //     } else {
        //         f7.toast.create({
        //             text: CLIPBOARD_FAILURE,
        //             destroyOnClose: true
        //         })
        //     }
        // })
        // TODO: get clipboard working.
    }

    function setupImgListener(msg) {
        var div = getMessageDiv(msg.id);
        var img = div.getElementsByClassName('message-image');
        if (img.length > 0) {
            img = img[0];


        }
    }

    /**
     * Generic function to add a message
     */
    function addMessage(type, text, time, image) {
        var options = {
            type: type,
            text: text
        };
        if (image) {
            options.imageSrc = image;
        }
        if (type === TYPE_SENT) {
            options.textFooter = SENDING_TEXT;
        } else if (type === TYPE_RECEIVED) {
            if (time) {
                options.textFooter = time;
            }
        }
        var msg = messages.addMessage(options);
        setupCopyListener(msg);
        return msg;
    }

    /**
     * Send a message (Adds to screen)
     */
    m.sendMessage = function (message, image) {
        return addMessage(TYPE_SENT, message, null, image);
    }

    var saveFailureAlerted = false;
    /**
     * Receive a message (Adds to screen)
     *
     * No return value
     */
    m.receiveMessage = function (message, timeString, image) {
        timeString = timeString.replace(/-/g,'/');
        var time = new Date(timeString + " UTC");
        var dateString = getDateString(time);
        if (image) {
            window.imageSaver.saveBase64Image({
                data: image,
                format: Configuration.OPT_PICTURE_TYPE
            }, function (img) {
                alert("saved img");
                console.log(img);
                alert(img);
                // alert('img save successful');
            }, function (err) {
                // Let user know we couldn't save the image. It's most likely
                // just storage permissions, so only alert user once per open
                // TODO: Add this in a setting, auto-save image
                if (!saveFailureAlerted) {
                    saveFailureAlerted = true;
                    alert('Unable to save image. Please allow storage permissions');
                }
            });
        } else {
            addMessage(TYPE_RECEIVED, message, dateString, image);
        }
    }

    m.linkMessages = function () {
        messages.messages.forEach(function (msg) {
            setupCopyListener(msg);
        })
    }

})(Messenger)