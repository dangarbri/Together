var KEY_PHRASE = "encryptionKey";

/**
 * Exactly what it sounds like
 */
function encryptMesage(text) {
    // TODO: should probably verify that a key has been set
    var cipherObject = CryptoJS.AES.encrypt(text, localStorage.getItem(KEY_PHRASE));
    // These are the only 2 things needed for decryption
    var encrypted = {
        ciphertext: cipherObject.ciphertext,
        salt: cipherObject.salt
    }
    return JSON.stringify(encrypted);
}

/**
 * Exactly what it sounds like
 */
function decryptMessage(cipherJson) {
    var cipherObject = JSON.parse(cipherJson);
    var decryptedData = CryptoJS.AES.decrypt(cipherObject, localStorage.getItem(KEY_PHRASE));
    return decryptedData.toString(CryptoJS.enc.Utf8);
}

function promptSuccess(key) {
    if (key) {
        localStorage.setItem(KEY_PHRASE, key);
    } else {
        promptForKey();
    }
}

/**
 * Make sure we have an encryption passphrase
 * First check local storage, if it's not there, then request it from user
 * repeatedly until they give one
 */
function encryptorInit() {
    var lock = document.getElementById("js-lock");
    lock.addEventListener("click", promptForKey);
    var key = localStorage.getItem(KEY_PHRASE);
    if (!key) {
        promptForKey();
    }
}

/**
 * Prompt for key
 */
function promptForKey(cb) {
    // app comes from index.js
    f7.dialog.prompt("Please enter a passphrase for encrypting messages. Your partner must enter the same key", "Encryption Key", promptSuccess, promptForKey);
}

// Copied from library. For some reason it was unable to set
// JSON.decycle = this function, so I just pasted it here.
function decycle(object, replacer) {
    "use strict";

// Make a deep copy of an object or array, assuring that there is at most
// one instance of each object or array in the resulting structure. The
// duplicate references (which might be forming cycles) are replaced with
// an object of the form

//      {"$ref": PATH}

// where the PATH is a JSONPath string that locates the first occurance.

// So,

//      var a = [];
//      a[0] = a;
//      return JSON.stringify(JSON.decycle(a));

// produces the string '[{"$ref":"$"}]'.

// If a replacer function is provided, then it will be called for each value.
// A replacer function receives a value and returns a replacement value.

// JSONPath is used to locate the unique object. $ indicates the top level of
// the object or array. [NUMBER] or [STRING] indicates a child element or
// property.

    var objects = new WeakMap();     // object to path mappings

    return (function derez(value, path) {

// The derez function recurses through the object, producing the deep copy.

        var old_path;   // The path of an earlier occurance of value
        var nu;         // The new object or array

// If a replacer function was provided, then call it to get a replacement value.

        if (replacer !== undefined) {
            value = replacer(value);
        }

// typeof null === "object", so go on if this value is really an object but not
// one of the weird builtin objects.

        if (
            typeof value === "object"
            && value !== null
            && !(value instanceof Boolean)
            && !(value instanceof Date)
            && !(value instanceof Number)
            && !(value instanceof RegExp)
            && !(value instanceof String)
        ) {

// If the value is an object or array, look to see if we have already
// encountered it. If so, return a {"$ref":PATH} object. This uses an
// ES6 WeakMap.

            old_path = objects.get(value);
            if (old_path !== undefined) {
                return {$ref: old_path};
            }

// Otherwise, accumulate the unique value and its path.

            objects.set(value, path);

// If it is an array, replicate the array.

            if (Array.isArray(value)) {
                nu = [];
                value.forEach(function (element, i) {
                    nu[i] = derez(element, path + "[" + i + "]");
                });
            } else {

// If it is an object, replicate the object.

                nu = {};
                Object.keys(value).forEach(function (name) {
                    nu[name] = derez(
                        value[name],
                        path + "[" + JSON.stringify(name) + "]"
                    );
                });
            }
            return nu;
        }
        return value;
    }(object, "$"));
};