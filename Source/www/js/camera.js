// TODO: Current cordova method of using the camera doesn't work on lower end phones
//       The Garbage collector may kill the app while the camera is in use. Update this
//       When cordova fixes it. Or find a workaround

var Photos = {};
(function (Photos) {
    // Get Camera encoding enum value based on configuration
    // If configuration is invalid return JPEG
    function getEncoding() {
        if (Configuration.OPT_PICTURE_TYPE == "png") {
            return Camera.EncodingType.PNG;
        } else if (Configuration.OPT_PICTURE_TYPE == "jpeg") {
            return Camera.EncodingType.JPEG;
        } else {
            return Camera.EncodingType.JPEG;
        }
    }

    function genUri(base64) {
        var type = Configuration.OPT_PICTURE_TYPE
        return "data:image/"+ type +";base64," + base64;
    }

    function getFile(path, callback) {
        window.resolveLocalFileSystemURL(path, function (fp) {
            callback(fp.nativeURL);
        }, function () {alert('Failed to get filesystem url')});
    }

    /**
     * Opens the camera to take a picture and creates a Data URI.
     *
     * @param callback function to handle data uri
     */
    Photos.TakePicture = function (callback) {
        if (callback == null) {
            console.error("No callback for camera");
            return;
        }
        navigator.camera.getPicture(function (image) {
            getFile(image, callback);
        }, null, {
            destinationType: Camera.DestinationType.FILE_URI,
            encodingType: getEncoding(),
            saveToPhotoAlbum: true,
            quality: Configuration.OPT_IMAGE_QUALITY
        });
    }

    Photos.SelectPicture = function (callback) {
        if (callback == null) {
            console.error("No callback for camera");
            return;
        }
        navigator.camera.getPicture(function (image) {
            getFile(image, callback);
        }, null, {
            destinationType: Camera.DestinationType.FILE_URI,
            encodingType: getEncoding(),
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
            quality: Configuration.OPT_IMAGE_QUALITY,
            saveToPhotoAlbum: true
        });
    }

})(Photos);