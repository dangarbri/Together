var Lists = {};

(function (Lists) {
    var listBtn = document.getElementById('js-list-btn');

    listBtn.addEventListener('click', function () {
        Menu.closeMenu();
        setTimeout(function () {
            alert(f7.views[0].name);
        }, 1000)
    })
})(Lists);