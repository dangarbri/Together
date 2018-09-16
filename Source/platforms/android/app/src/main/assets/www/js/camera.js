// TODO: Current cordova method of using the camera doesn't work on lower end phones
//       The Garbage collector may kill the app while the camera is in use. Update this
//       When cordova fixes it. Or find a workaround

var Photos = {};
(function (Photos) {

    function genUri(base64) {
        return "data:image/png;base64," + base64;
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
            var uri = genUri(image)
            callback(uri);
        }, null, {
            destinationType: Camera.DestinationType.DATA_URL,
            encodingType: Camera.EncodingType.PNG
        });
    }

    Photos.SelectPicture = function (callback) {
        if (callback == null) {
            console.error("No callback for camera");
            return;
        }
        navigator.camera.getPicture(function (image) {
            var uri = genUri(image);
            callback(uri);
        }, null, {
            destinationType: Camera.DestinationType.DATA_URL,
            encodingType: Camera.EncodingType.PNG,
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY
        });
    }

})(Photos);