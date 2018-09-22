var Menu = {};

(function (Menu) {
    var menuBtn = document.getElementById('js-menu-btn');
    var menuSidebar = document.getElementById('js-menu-sidebar');

    Menu.openMenu = function () {
        f7.panel.open('left');
    }

    menuBtn.addEventListener('click', Menu.openMenu);
})(Menu)