(function (window, document) {
    "use strict";

    var namespace = window.SakuraHomepage || (window.SakuraHomepage = {});

    function collectEntranceTargets() {
        return [
            document.querySelector('[data-entrance="avatar"]'),
            document.querySelector('[data-entrance="title"]'),
            document.querySelector('[data-entrance="subtitle"]'),
            document.querySelector('[data-entrance="divider"]'),
            document.querySelector('[data-entrance="description"]'),
            document.querySelector('[data-entrance="links"]'),
            document.querySelector('[data-entrance="social"]')
        ];
    }

    function createLayoutController() {
        return namespace.layout.createLayoutController({
            linkRoot: document.getElementById("primaryLinks"),
            socialRoot: document.getElementById("socialLinks"),
            pageShell: document.getElementById("pageShell")
        });
    }

    function startBackgroundWhenReady() {
        if (typeof namespace.startSakuraBackground !== "function") {
            window.requestAnimationFrame(startBackgroundWhenReady);
            return;
        }

        if (namespace.backgroundStarted === true) {
            return;
        }

        namespace.backgroundStarted = true;
        namespace.startSakuraBackground({
            canvas: document.getElementById("sakura-canvas"),
            fallbackColor: "rgb(44, 44, 46)"
        });
    }

    function startApp() {
        var data = namespace.siteData;
        var layoutController;
        var protectedRoot = document.getElementById("pageShell");

        if (!data) {
            return;
        }

        namespace.renderPageContent(data);
        namespace.modal.init(data.modals);
        namespace.contentGuard.init(protectedRoot);

        layoutController = createLayoutController();
        layoutController.run();
        namespace.entrance.play(collectEntranceTargets());
        namespace.layoutController = layoutController;
        window.requestAnimationFrame(startBackgroundWhenReady);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startApp, {
            once: true
        });
    } else {
        startApp();
    }
})(window, document);
