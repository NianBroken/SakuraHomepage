(function (window) {
    "use strict";

    var namespace = window.SakuraHomepage || (window.SakuraHomepage = {});
    var STAGGER_MS = 140;

    function playEntrance(elements) {
        var list = Array.isArray(elements) ? elements : [];

        for (var index = 0; index < list.length; index += 1) {
            (function (element, delay) {
                if (!element) {
                    return;
                }

                window.setTimeout(function () {
                    element.classList.add("is-visible");
                }, delay);
            })(list[index], index * STAGGER_MS);
        }
    }

    namespace.entrance = {
        play: playEntrance
    };
})(window);
