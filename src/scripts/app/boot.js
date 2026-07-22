(function (window, document) {
    "use strict";

    var namespace = window.SakuraHomepage || (window.SakuraHomepage = {});
    var COPYRIGHT_FALLBACK_YEAR = 2026;
    var appStarted = false;

    function getCopyrightYear() {
        var year;

        try {
            year = new window.Date().getFullYear();
        } catch (error) {
            return COPYRIGHT_FALLBACK_YEAR;
        }

        if (!Number.isFinite(year) || year <= 0) {
            return COPYRIGHT_FALLBACK_YEAR;
        }

        return year;
    }

    function syncCopyright(copyright) {
        if (!copyright) {
            return;
        }

        copyright.textContent = "Copyright © " + getCopyrightYear() + " NianBroken. All rights reserved.";
    }

    function collectContentEntranceTargets() {
        return [
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

    function playEntranceWhenReady(targets) {
        window.requestAnimationFrame(function () {
            namespace.entrance.play(targets);
            window.requestAnimationFrame(startBackgroundWhenReady);
        });
    }

    function playAvatarEntranceWhenReady(avatarReady) {
        avatarReady.then(function (avatarFrame) {
            if (!avatarFrame) {
                return;
            }

            playEntranceWhenReady([avatarFrame]);
        });
    }

    function startApp() {
        var data = namespace.siteData;
        var avatarReady;
        var layoutController;
        var protectedRoot = document.getElementById("pageShell");
        var copyrightRoot = document.getElementById("siteFooter");
        var entranceTargets;

        syncCopyright(document.getElementById("siteCopyright"));
        namespace.contentGuard.init(protectedRoot);
        namespace.contentGuard.init(copyrightRoot);

        if (!data) {
            return;
        }

        avatarReady = namespace.renderPageContent(data);
        namespace.modal.init(data.modals);

        layoutController = createLayoutController();
        layoutController.run();
        entranceTargets = collectContentEntranceTargets();
        playEntranceWhenReady(entranceTargets);
        playAvatarEntranceWhenReady(avatarReady);
        namespace.layoutController = layoutController;
        appStarted = true;
    }

    function handlePageShow(event) {
        var layoutController = namespace.layoutController;
        var entranceTargets = collectContentEntranceTargets();

        if (!appStarted) {
            startApp();
            return;
        }

        if (!event.persisted) {
            return;
        }

        if (layoutController) {
            layoutController.run();
        }

        if (!namespace.entrance.isPlayed(entranceTargets)) {
            playEntranceWhenReady(entranceTargets);
            return;
        }

        namespace.backgroundStarted = false;
        window.requestAnimationFrame(startBackgroundWhenReady);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startApp, {
            once: true
        });
    } else {
        startApp();
    }

    window.addEventListener("pageshow", handlePageShow);
})(window, document);
