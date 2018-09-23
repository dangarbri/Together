var Lists = {};

(function (Lists) {
    var ListMenu;
    var addedListener = false;

    /**
     * Initialize some buttons in the list view.
     * Called by page router in index.js
     */
    Lists.Initialize = function () {
        var listBtn = document.getElementById('js-lists-back-btn');
        if (!addedListener) {
            listBtn.addEventListener('click', function () {
                f7.mainView.router.back();
            });
        }
    }
})(Lists);