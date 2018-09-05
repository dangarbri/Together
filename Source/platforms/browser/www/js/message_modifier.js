var Messenger = {};
(function (m) {

    var SENT_TEXT = "sent at";
    var READ_TEXT = "read at";
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
     * Sets timestamp for message sent
     * @param messageDiv - message div created by add message
     */
    m.setSentTimestamp = function (messageDiv) {
        var container = messageDiv.getElementsByClassName('message-footer')[0];
        container.textContent = SENT_TEXT + " " + getDateString();
    }

    m.setReadTimestamp = function (footer) {
        if (footer.textContent.indexOf(SENT_TEXT) >= 0) {
            footer.textContent = READ_TEXT + " " + getDateString();
        }
    }

})(Messenger)