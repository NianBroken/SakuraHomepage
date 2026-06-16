(function (window, document) {
    "use strict";

    var namespace = window.SakuraHomepage || (window.SakuraHomepage = {});

    function setDisplayContent(data) {
        var avatar = document.getElementById("profileAvatar");
        var title = document.getElementById("profileTitle");
        var subtitle = document.getElementById("profileSubtitle");
        var description = document.getElementById("profileDescription");

        avatar.src = data.profile.avatarSrc;
        avatar.alt = data.profile.title + " 头像";
        avatar.draggable = false;
        title.textContent = data.profile.title;
        subtitle.textContent = data.profile.subtitle;
        description.textContent = data.profile.description;
    }

    function createPrimaryItem(item) {
        var element;
        var label = document.createElement("span");

        label.className = "link-chip__label";
        label.textContent = item.label;

        if (item.type === "modal") {
            element = document.createElement("button");
            element.type = "button";
            element.addEventListener("click", function () {
                namespace.modal.open(item.modalKey);
            });
        } else {
            element = document.createElement("a");
            element.href = item.href;

            if (item.target) {
                element.target = item.target;
            }
            if (item.target === "_blank") {
                element.rel = "noreferrer noopener";
            }
        }

        element.className = "link-chip";
        element.dataset.label = item.label;
        element.appendChild(label);

        return element;
    }

    function createSocialItem(item) {
        var link = document.createElement("a");
        var icon = document.createElement("i");

        link.className = "social-chip";
        link.href = item.href;
        link.target = "_blank";
        link.rel = "noreferrer noopener";
        link.setAttribute("aria-label", item.label);
        link.title = item.label;

        icon.className = "iconfont " + item.iconClass;
        icon.setAttribute("aria-hidden", "true");

        link.appendChild(icon);
        return link;
    }

    function renderCollection(root, items, factory) {
        var fragment = document.createDocumentFragment();
        var index;

        for (index = 0; index < items.length; index += 1) {
            fragment.appendChild(factory(items[index]));
        }

        root.replaceChildren(fragment);
    }

    function startApp() {
        var data = namespace.siteData;
        var linkRoot = document.getElementById("primaryLinks");
        var socialRoot = document.getElementById("socialLinks");
        var canvas = document.getElementById("sakura-canvas");
        var layoutController;
        var entranceTargets;

        if (!data) {
            return;
        }

        setDisplayContent(data);
        renderCollection(linkRoot, data.primaryLinks, createPrimaryItem);
        renderCollection(socialRoot, data.socialLinks, createSocialItem);
        namespace.modal.init(data.modals);
        namespace.startSakuraBackground({
            canvas: canvas,
            fallbackColor: "rgb(44, 44, 46)"
        });
        layoutController = namespace.layout.createLayoutController({
            linkRoot: linkRoot,
            socialRoot: socialRoot,
            pageShell: document.getElementById("pageShell")
        });
        layoutController.run();

        entranceTargets = [
            document.querySelector('[data-entrance="avatar"]'),
            document.querySelector('[data-entrance="title"]'),
            document.querySelector('[data-entrance="subtitle"]'),
            document.querySelector('[data-entrance="divider"]'),
            document.querySelector('[data-entrance="description"]'),
            document.querySelector('[data-entrance="links"]'),
            document.querySelector('[data-entrance="social"]')
        ];

        namespace.entrance.play(entranceTargets);
        namespace.layoutController = layoutController;
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startApp, {
            once: true
        });
    } else {
        startApp();
    }
})(window, document);
