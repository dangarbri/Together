var MESSAGE_FILE = "messages";
var LISTS_FILE   = "lists";

function readFile(fileEntry, cb) {
    fileEntry.file(function (file) {
        var reader = new FileReader();

        reader.onloadend = function() {
            console.log("Successful file read, running callback");
            if (this.result) {
                cb(JSON.parse(this.result));
            } else {
                cb(null);
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

function readBinaryFile(fileEntry, cb) {

    fileEntry.file(function (file) {
        var reader = new FileReader();

        reader.onloadend = function() {
            cb(this.result);
        };

        reader.readAsDataURL(file);

    }, function () {alert('Failed to read selected image')});
}

function getFileDate() {
    var date = new Date();
    return date.getFullYear() +
          "_" + date.getMonth() +
          "_" + date.getDate() +
          "_" + date.getHours() +
          "_" + date.getMinutes() +
          "_" + date.getSeconds() +
          "_" + Math.floor(Math.random() * 100000)
}

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

function saveLists(lists) {
    var fname = cordova.file.applicationStorageDirectory + "/" + LISTS_FILE;
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
        fs.root.getFile(LISTS_FILE, { create: true, exclusive: false }, function (fileEntry) {
            writeFile(fileEntry, JSON.stringify(lists));
        }, function () {alert("Failed to get file handle")});
    }, function () {alert("Failed to get filesystem access")});
}

function readLists(callback) {
    var fname = cordova.file.applicationStorageDirectory + "/" + LISTS_FILE;
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
        fs.root.getFile(LISTS_FILE, { create: true, exclusive: false }, function (fileEntry) {
            readFile(fileEntry, callback);
        }, function () {alert("Failed to get file handle")});
    }, function () {alert("Failed to get filesystem access")});
}

function loadImageData(path, callback) {
    window.resolveLocalFileSystemURL(path, function (fp) {
        readBinaryFile(fp, callback);
    }, function () {alert('Failed to get filesystem url')});
}