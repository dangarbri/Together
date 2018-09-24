var Menu = {};

(function (Menu) {

    Menu.Pages = {
        MESSAGES: 'messages',
        LISTS: 'lists'
    }

    /**
     * Menu element accessors
     */
    Menu.Item = {
        ListsLink: document.getElementById('js-menu-list')
    }

    /**
     * Open menu panel
     */
    Menu.openMenu = function () {
        f7.panel.open('left');
    }

    /**
     * Close menu panel
     */
    Menu.closeMenu = function () {
        f7.panel.close('left');
    }

    /**
     * Perform menu initialization.
     * Mainly button listeners
     * Close menu after link click
     */
    Menu.initialize = function () {
        var menuBtn = document.getElementById('js-menu-btn');
        menuBtn.addEventListener('click', Menu.openMenu);
        Object.keys(Menu.Item).forEach(function (key) {
            Menu.Item[key].addEventListener('click', Menu.closeMenu);
        });
    };

    Menu.GetPage = function () {
        var page = f7.mainView.router.url;
        var words = page.split('/');
        return words[words.length - 1];
    }
})(Menu)