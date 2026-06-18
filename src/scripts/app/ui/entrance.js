(function (window) {
    "use strict";

    var namespace = window.SakuraHomepage || (window.SakuraHomepage = {});
    var STAGGER_MS = 140;
    var DELAY_PROPERTY = "--entrance-delay";
    var ACTIVE_CLASS = "is-visible";
    var COMPLETE_CLASS = "is-complete";

    function toElementList(elements) {
        return Array.isArray(elements) ? elements.filter(Boolean) : [];
    }

    function clearCompletionState(element) {
        element.classList.remove(COMPLETE_CLASS);
        element.onanimationend = null;
        element.onanimationcancel = null;
    }

    function attachCompletionState(element) {
        element.onanimationend = function (event) {
            if (event.target !== element) {
                return;
            }

            element.classList.add(COMPLETE_CLASS);
        };

        element.onanimationcancel = function () {
            element.classList.remove(COMPLETE_CLASS);
        };
    }

    function playEntrance(elements) {
        var list = toElementList(elements);

        for (var index = 0; index < list.length; index += 1) {
            var element = list[index];

            element.style.setProperty(DELAY_PROPERTY, String(index * STAGGER_MS) + "ms");
            element.classList.remove(ACTIVE_CLASS);
            clearCompletionState(element);
            attachCompletionState(element);
        }

        window.requestAnimationFrame(function () {
            for (var frameIndex = 0; frameIndex < list.length; frameIndex += 1) {
                list[frameIndex].classList.add(ACTIVE_CLASS);
            }
        });
    }

    function isPlayed(elements) {
        var list = toElementList(elements);

        if (list.length === 0) {
            return false;
        }

        for (var index = 0; index < list.length; index += 1) {
            if (!list[index].classList.contains(ACTIVE_CLASS)) {
                return false;
            }
        }

        return true;
    }

    namespace.entrance = {
        play: playEntrance,
        isPlayed: isPlayed
    };
})(window);
