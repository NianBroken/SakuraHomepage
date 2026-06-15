(function (window, document) {
    "use strict";

    var namespace = window.SakuraHomepage || (window.SakuraHomepage = {});
    var BASE_VIEWPORT = {
        width: 1440,
        height: 900
    };
    var MIN_SCALE = 0.34;
    var MAX_SCALE = 1;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function toPixels(value) {
        var parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function syncViewportScale() {
        var widthScale = window.innerWidth / BASE_VIEWPORT.width;
        var heightScale = window.innerHeight / BASE_VIEWPORT.height;
        var scale = clamp(Math.min(widthScale, heightScale), MIN_SCALE, MAX_SCALE);

        document.documentElement.style.setProperty("--viewport-scale", scale.toFixed(4));
        return scale;
    }

    function buildRowDistribution(totalItems, itemsPerRow) {
        var distribution = [];
        var fullRowSize = Math.max(1, itemsPerRow);
        var remainder = totalItems % fullRowSize;
        var consumed = 0;

        if (remainder > 0) {
            distribution.push(remainder);
            consumed += remainder;
        }

        while (consumed < totalItems) {
            distribution.push(Math.min(fullRowSize, totalItems - consumed));
            consumed += fullRowSize;
        }

        if (distribution.length === 0) {
            distribution.push(totalItems);
        }

        return distribution;
    }

    function createMeasureNode(baseClassName, extraClassName) {
        var node = document.createElement("span");

        node.className = baseClassName + " " + extraClassName;
        document.body.appendChild(node);
        return node;
    }

    function measureLinkWidth(items) {
        if (items.length === 0) {
            return 0;
        }

        var probe = createMeasureNode(items[0].className, "link-chip--measure");
        var maxWidth = 0;

        for (var index = 0; index < items.length; index += 1) {
            probe.textContent = items[index].dataset.label || "";
            maxWidth = Math.max(maxWidth, Math.ceil(probe.getBoundingClientRect().width));
        }

        probe.remove();
        return maxWidth;
    }

    function buildRows(root, items, rowClassName, distribution) {
        var fragment = document.createDocumentFragment();
        var cursor = 0;

        for (var rowIndex = 0; rowIndex < distribution.length; rowIndex += 1) {
            var row = document.createElement("div");
            var rowSize = distribution[rowIndex];

            row.className = rowClassName;

            for (var count = 0; count < rowSize; count += 1) {
                row.appendChild(items[cursor]);
                cursor += 1;
            }

            fragment.appendChild(row);
        }

        root.replaceChildren(fragment);
    }

    function layoutLinkRows(root) {
        var items = Array.prototype.slice.call(root.querySelectorAll(".link-chip"));

        if (items.length === 0) {
            return;
        }

        var availableWidth = root.clientWidth;
        var gap = toPixels(window.getComputedStyle(document.documentElement).getPropertyValue("--link-gap"));
        var measuredWidth = measureLinkWidth(items);
        var uniformWidth = Math.min(measuredWidth, availableWidth);
        var itemsPerRow = Math.max(1, Math.floor((availableWidth + gap) / (uniformWidth + gap)));
        var distribution = buildRowDistribution(items.length, itemsPerRow);

        root.style.setProperty("--uniform-link-width", uniformWidth + "px");
        buildRows(root, items, "link-row", distribution);
    }

    function resolveIconWidth(items) {
        if (items.length === 0) {
            return 0;
        }

        var probe = createMeasureNode(items[0].className, "social-chip--measure");
        var width = Math.ceil(probe.getBoundingClientRect().width);

        probe.remove();
        return width;
    }

    function layoutSocialRows(root) {
        var items = Array.prototype.slice.call(root.querySelectorAll(".social-chip"));

        if (items.length === 0) {
            return;
        }

        var availableWidth = root.clientWidth;
        var gap = toPixels(window.getComputedStyle(document.documentElement).getPropertyValue("--icon-gap"));
        var iconWidth = resolveIconWidth(items);
        var itemsPerRow = Math.max(1, Math.floor((availableWidth + gap) / (iconWidth + gap)));
        var distribution = buildRowDistribution(items.length, itemsPerRow);

        buildRows(root, items, "social-row", distribution);
    }

    function createLayoutController(config) {
        var frameId = 0;
        var linkRoot = config.linkRoot;
        var socialRoot = config.socialRoot;
        var resizeObserver = null;

        function run() {
            frameId = 0;
            syncViewportScale();
            layoutLinkRows(linkRoot);
            layoutSocialRows(socialRoot);
        }

        function schedule() {
            if (frameId) {
                return;
            }

            frameId = window.requestAnimationFrame(run);
        }

        window.addEventListener("resize", schedule, {
            passive: true
        });
        window.addEventListener("orientationchange", schedule, {
            passive: true
        });

        if (window.ResizeObserver) {
            resizeObserver = new window.ResizeObserver(schedule);
            resizeObserver.observe(linkRoot);
            resizeObserver.observe(socialRoot);
        }

        return {
            run: run,
            schedule: schedule,
            destroy: function () {
                if (frameId) {
                    window.cancelAnimationFrame(frameId);
                    frameId = 0;
                }

                window.removeEventListener("resize", schedule);
                window.removeEventListener("orientationchange", schedule);

                if (resizeObserver) {
                    resizeObserver.disconnect();
                }
            }
        };
    }

    namespace.layout = {
        createLayoutController: createLayoutController,
        syncViewportScale: syncViewportScale
    };
})(window, document);
