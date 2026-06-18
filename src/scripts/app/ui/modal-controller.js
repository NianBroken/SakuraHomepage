(function (window, document) {
    "use strict";

    var namespace = window.SakuraHomepage || (window.SakuraHomepage = {});
    var CLOSED_CLASS = "is-closed";
    var LOADING_CLASS = "is-loading";
    var OPEN_CLASS = "is-open";
    var modalState = {
        modal: null,
        image: null,
        loader: null,
        modalMap: {},
        activeKey: "",
        requestId: 0
    };

    function setModalState(nextState) {
        modalState.modal.classList.remove(CLOSED_CLASS, LOADING_CLASS, OPEN_CLASS);
        modalState.modal.classList.add(nextState);
    }

    function clearModalContent() {
        modalState.image.removeAttribute("src");
        modalState.image.alt = "";
    }

    function applyModalImage(sourceImage, altText) {
        sourceImage.className = "modal__image";
        sourceImage.alt = altText;
        sourceImage.draggable = false;
        modalState.image.replaceWith(sourceImage);
        sourceImage.addEventListener("click", function (event) {
            event.stopPropagation();
        });
        modalState.image = sourceImage;
    }

    function closeModal() {
        if (!modalState.modal || modalState.modal.classList.contains(CLOSED_CLASS)) {
            return;
        }

        modalState.requestId += 1;
        modalState.activeKey = "";
        modalState.modal.setAttribute("aria-hidden", "true");
        modalState.modal.removeAttribute("aria-label");
        clearModalContent();
        setModalState(CLOSED_CLASS);
    }

    function handleKeydown(event) {
        if (event.key === "Escape") {
            closeModal();
        }
    }

    function ensureModal() {
        if (modalState.modal) {
            return;
        }

        var modal = document.createElement("div");
        var loader = document.createElement("div");
        var image = document.createElement("img");

        modal.className = "modal is-closed";
        modal.setAttribute("aria-hidden", "true");
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");

        loader.className = "modal__loader";
        loader.setAttribute("aria-hidden", "true");

        image.className = "modal__image";
        image.alt = "";
        image.draggable = false;

        modal.appendChild(loader);
        modal.appendChild(image);
        modal.addEventListener("click", closeModal);
        loader.addEventListener("click", function (event) {
            event.stopPropagation();
        });
        image.addEventListener("click", function (event) {
            event.stopPropagation();
        });

        document.addEventListener("keydown", handleKeydown);
        document.body.appendChild(modal);

        modalState.modal = modal;
        modalState.loader = loader;
        modalState.image = image;
    }

    function initModal(modalMap) {
        modalState.modalMap = modalMap || {};
        ensureModal();
    }

    function openModal(key) {
        var config = modalState.modalMap[key];
        var requestId;

        if (!config) {
            return;
        }

        ensureModal();
        modalState.requestId += 1;
        requestId = modalState.requestId;
        modalState.activeKey = key;
        clearModalContent();
        modalState.modal.setAttribute("aria-label", config.imageAlt || "弹窗内容");
        modalState.modal.setAttribute("aria-hidden", "false");
        setModalState(LOADING_CLASS);

        namespace.imageLoader.load(config.imageSrc)
            .then(function (loadedImage) {
                if (requestId !== modalState.requestId || modalState.activeKey !== key) {
                    return;
                }

                applyModalImage(loadedImage, config.imageAlt || "");

                window.requestAnimationFrame(function () {
                    if (requestId !== modalState.requestId || modalState.activeKey !== key) {
                        return;
                    }

                    setModalState(OPEN_CLASS);
                });
            })
            .catch(function () {
                if (requestId !== modalState.requestId || modalState.activeKey !== key) {
                    return;
                }

                closeModal();
            });
    }

    namespace.modal = {
        init: initModal,
        open: openModal,
        close: closeModal
    };
})(window, document);
