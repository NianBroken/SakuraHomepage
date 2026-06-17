(function (window, document) {
    "use strict";

    var namespace = window.SakuraHomepage || (window.SakuraHomepage = {});
    var modalState = {
        modal: null,
        image: null,
        modalMap: {},
        activeKey: ""
    };

    function closeModal() {
        if (!modalState.modal || !modalState.modal.classList.contains("is-open")) {
            return;
        }

        modalState.activeKey = "";
        modalState.modal.classList.remove("is-open");
        modalState.modal.setAttribute("aria-hidden", "true");
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
        var image = document.createElement("img");

        modal.className = "modal";
        modal.setAttribute("aria-hidden", "true");
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");

        image.className = "modal__image";
        image.alt = "";
        image.draggable = false;

        modal.appendChild(image);
        modal.addEventListener("click", closeModal);
        image.addEventListener("click", function (event) {
            event.stopPropagation();
        });

        document.addEventListener("keydown", handleKeydown);
        document.body.appendChild(modal);

        modalState.modal = modal;
        modalState.image = image;
    }

    function initModal(modalMap) {
        modalState.modalMap = modalMap || {};
        ensureModal();
    }

    function openModal(key) {
        var config = modalState.modalMap[key];

        if (!config) {
            return;
        }

        ensureModal();
        modalState.activeKey = key;
        modalState.image.src = config.imageSrc;
        modalState.image.alt = config.imageAlt || "";
        modalState.modal.setAttribute("aria-label", config.imageAlt || "弹窗内容");
        modalState.modal.setAttribute("aria-hidden", "false");
        modalState.modal.classList.add("is-open");
    }

    namespace.modal = {
        init: initModal,
        open: openModal,
        close: closeModal
    };
})(window, document);
