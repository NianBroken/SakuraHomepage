(function (window, document) {
    "use strict";

    var namespace = window.SakuraHomepage || (window.SakuraHomepage = {});

    function shouldBlockTarget(root, eventTarget) {
        return !!(root && eventTarget instanceof Node && root.contains(eventTarget));
    }

    function blockEvent(root, event) {
        if (shouldBlockTarget(root, event.target)) {
            event.preventDefault();
        }
    }

    function initContentGuard(root) {
        if (!root || root.dataset.contentGuardBound === "true") {
            return;
        }

        root.dataset.contentGuardBound = "true";

        root.addEventListener("copy", function (event) {
            blockEvent(root, event);
        });
        root.addEventListener("cut", function (event) {
            blockEvent(root, event);
        });
        root.addEventListener("selectstart", function (event) {
            blockEvent(root, event);
        });
        root.addEventListener("dragstart", function (event) {
            blockEvent(root, event);
        });

        root.addEventListener("keydown", function (event) {
            var key = String(event.key || "").toLowerCase();
            var isCopyCombo = (event.ctrlKey || event.metaKey) && (key === "c" || key === "x" || key === "a");

            if (isCopyCombo && shouldBlockTarget(root, event.target)) {
                event.preventDefault();
            }
        });
    }

    namespace.contentGuard = {
        init: initContentGuard
    };
})(window, document);
