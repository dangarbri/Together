var Lists = {};

(function (Lists) {
    var addedListener = false;

    /**
     * Initialize some buttons in the list view.
     * Called by page router in index.js
     */
    Lists.Initialize = function () {
        var listBtn      = document.getElementById('js-lists-back-btn');
        var newListInput = document.getElementById('js-list-new');
        var newListBtn   = document.getElementById('js-list-new-btn');
        if (!addedListener) {
            listBtn.addEventListener('click', function () {
                f7.mainView.router.back();
            });
        }
    }

    /**
     * Pull new list items from server and merge them into local copy.
     */
    Lists.Sync = function () {
        Server.GetListItems(function (items) {
        });
    }
})(Lists);