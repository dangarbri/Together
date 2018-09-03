var MESSAGE_FILE = "messages";

function readFile(fileEntry, cb) {
    fileEntry.file(function (file) {
        var reader = new FileReader();

        reader.onloadend = function() {
            console.log("Successful file read, running callback");
            if (this.result) {
                cb(JSON.parse(this.result));
            }
        };

        reader.readAsText(file);

    }, function () {alert("Error reading file")});
}

function writeFile(fileEntry, dataObj) {
    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function (fileWriter) {
        fileWriter.onwriteend = function() {
            console.log("Successfully saved messages");
        };

        fileWriter.onerror = function (e) {
            alert("Failed file save messages: " + e.toString());
        };

        fileWriter.write(dataObj);
    });
}

var FILENAME = "messages";
/**
 * Save messages to file
 */
function saveMessages(messages) {
    var fname = cordova.file.applicationStorageDirectory + "/" + MESSAGE_FILE;
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
        fs.root.getFile(MESSAGE_FILE, { create: true, exclusive: false }, function (fileEntry) {
            writeFile(fileEntry, JSON.stringify(messages));
        }, function () {alert("Failed to get file handle")});
    }, function () {alert("Failed to get filesystem access")});
}

/**
 * Restore messages from file
 * passes data back in the callback
 */
function retrieveSavedMessages(cb) {
    var fname = cordova.file.applicationStorageDirectory + "/" + MESSAGE_FILE;
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
        fs.root.getFile(MESSAGE_FILE, { create: true, exclusive: false }, function (fileEntry) {
            readFile(fileEntry, cb);
        }, function () {alert("Failed to get file handle")});
    }, function () {alert("Failed to get filesystem access")});
}
