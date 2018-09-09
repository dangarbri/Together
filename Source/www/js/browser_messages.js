/**
 * For use if browser messaging. If browser is in focus then we will poll for new messages.
 * If not in focus don't poll for messages.
 * Since the server is setup to notify the other device that a message is read when it's pulled from the server
 * this means the browser can't pull whenever it wants (Because I'm too lazy to update it for that)
 * The server will also return a field in the messages json to tell us if the previous messages sent were read or not
 * (That last one did require an update, but it was much easier)
 */
var BROWSER_REFRESH_INTERVAL = 2000; // Update messages every 2 seconds
var NEW_MESSAGE_TITLE        = " - New Message";
var gUsingBrowser = false;
var gBrowserInterval = 0;
var gMessagePending = false;
var gTitle;
var gInFocus = false;

var BrowserMessenger = {};
(function (b) {
    /**
     * If browser is detected, then begin browser messaging. If this function is not called
     * then none of these features will run
     */
    b.Start = function () {
        // Register browser with server as a null token so FCM messages are sent
        registerDevice(null);
        gTitle = document.title;
        onResume();
        document.addEventListener('pause', onPause);
        document.addEventListener('resume', onResume);
        gInFocus = true;
        gUsingBrowser = true;
        setInterval(refresh, BROWSER_REFRESH_INTERVAL);
    }

    b.markRead = function () {
        if (gUsingBrowser) {
            Messenger.markRead();
        }
    }

    b.NotifyMessageRead = function () {
        ServerApi.NotifyMessageRead();
    }

    b.MessageReceived = function () {
        if (gInFocus) {
            b.NotifyMessageRead();
        } else {
            gMessagePending = true;
            NotifyBrowser();
        }
    }

    function NotifyBrowser() {
        document.title = gTitle + NEW_MESSAGE_TITLE;
    }

    function refresh() {
        refreshMessages(false);
    }

    function onPause() {
        gInFocus = false;
    }

    function onResume() {
        gInFocus = true;
        if (gMessagePending) {
            gMessagePending = false;
            b.NotifyMessageRead();
        }
        document.title = gTitle;
    }
})(BrowserMessenger);