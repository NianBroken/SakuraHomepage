(function (window, document) {
    "use strict";

    var namespace = window.SakuraHomepage || (window.SakuraHomepage = {});
    var AVATAR_READY_CLASS = "is-ready";

    function applyAvatarImage(avatar, sourceImage, altText) {
        sourceImage.id = avatar.id;
        sourceImage.className = avatar.className;
        sourceImage.alt = altText;
        sourceImage.draggable = false;
        avatar.replaceWith(sourceImage);

        return sourceImage;
    }

    function populateProfile(profile) {
        var avatar = document.getElementById("profileAvatar");
        var avatarFrame = document.getElementById("profileAvatarFrame");
        var title = document.getElementById("profileTitle");
        var subtitle = document.getElementById("profileSubtitle");
        var description = document.getElementById("profileDescription");

        avatar.draggable = false;
        avatar.alt = profile.title + " 头像";
        avatar.removeAttribute("src");
        avatarFrame.classList.remove(AVATAR_READY_CLASS);
        title.textContent = profile.title;
        subtitle.textContent = profile.subtitle;
        description.textContent = profile.description;

        return namespace.imageLoader.load(profile.avatarSrc)
            .then(function (loadedImage) {
                avatar = applyAvatarImage(avatar, loadedImage, profile.title + " 头像");
                avatarFrame.classList.add(AVATAR_READY_CLASS);

                return avatarFrame;
            })
            .catch(function () {
                avatar.removeAttribute("src");
                avatarFrame.classList.remove(AVATAR_READY_CLASS);

                return null;
            });
    }

    function createPrimaryLink(item) {
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

    function createSocialLink(item) {
        var element;
        var icon = document.createElement("span");
        var iconUrl = new URL(item.iconSrc, window.location.href).href;

        if (item.type === "modal") {
            element = document.createElement("button");
            element.type = "button";
            element.addEventListener("click", function () {
                namespace.modal.open(item.modalKey);
            });
        } else {
            element = document.createElement("a");
            element.href = item.href;
            element.target = "_blank";
            element.rel = "noreferrer noopener";
        }

        element.className = "social-chip";
        element.setAttribute("aria-label", item.label);
        element.title = item.label;

        icon.className = "social-chip__icon";
        icon.style.setProperty("--social-icon-src", "url(\"" + iconUrl + "\")");
        icon.setAttribute("aria-hidden", "true");

        element.appendChild(icon);
        return element;
    }

    function renderCollection(root, items, factory) {
        var fragment = document.createDocumentFragment();
        var index;

        for (index = 0; index < items.length; index += 1) {
            fragment.appendChild(factory(items[index]));
        }

        root.replaceChildren(fragment);
        return items.length;
    }

    function renderPageContent(data) {
        var avatarReady = populateProfile(data.profile);
        var primaryLinks = document.getElementById("primaryLinks");
        var primaryLinkCount;

        primaryLinkCount = renderCollection(primaryLinks, data.primaryLinks, createPrimaryLink);
        primaryLinks.hidden = primaryLinkCount === 0;
        renderCollection(document.getElementById("socialLinks"), data.socialLinks, createSocialLink);

        return avatarReady;
    }

    namespace.renderPageContent = renderPageContent;
})(window, document);
