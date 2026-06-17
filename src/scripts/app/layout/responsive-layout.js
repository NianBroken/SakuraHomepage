(function (window, document) {
    "use strict";

    var namespace = window.SakuraHomepage || (window.SakuraHomepage = {});
    var BASE_VIEWPORT = {
        width: 1440,
        height: 900
    };
    var MIN_SCALE = 0.46;
    var MAX_SCALE = 1;
    var MIN_LINK_ROW_GAP = 12;
    var MIN_ICON_GAP = 6;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function toPixels(value) {
        var parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function createMeasureNode(baseClassName, extraClassName) {
        var node = document.createElement("span");

        node.className = baseClassName + " " + extraClassName;
        document.body.appendChild(node);
        return node;
    }

    function getActualGap(className) {
        var row = document.createElement("div");
        var computedGap = 0;

        row.className = className;
        row.style.position = "fixed";
        row.style.left = "-9999px";
        row.style.top = "-9999px";
        row.style.visibility = "hidden";
        document.body.appendChild(row);
        computedGap = toPixels(window.getComputedStyle(row).columnGap);
        row.remove();

        if (computedGap > 0) {
            return computedGap;
        }

        return className === "link-row" ? MIN_LINK_ROW_GAP : MIN_ICON_GAP;
    }

    function buildRowDistribution(totalItems, itemsPerRow) {
        var distribution = [];
        var normalizedItemsPerRow = Math.max(1, itemsPerRow);
        var remainder = totalItems % normalizedItemsPerRow;
        var consumed = 0;

        if (remainder > 0) {
            distribution.push(remainder);
            consumed += remainder;
        }

        while (consumed < totalItems) {
            distribution.push(Math.min(normalizedItemsPerRow, totalItems - consumed));
            consumed += normalizedItemsPerRow;
        }

        if (distribution.length === 0) {
            distribution.push(totalItems);
        }

        return distribution;
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

    function syncViewportScale() {
        var viewportWidth = window.innerWidth;
        var viewportHeight = window.innerHeight;
        var widthScale = viewportWidth / BASE_VIEWPORT.width;
        var heightScale = viewportHeight / BASE_VIEWPORT.height;
        var harmonicScale = (2 * widthScale * heightScale) / Math.max(widthScale + heightScale, 0.0001);
        var minDimensionScale = Math.min(viewportWidth, viewportHeight) / 430;
        var compactBoost = clamp(minDimensionScale, 0.94, 1.18);
        var scale = clamp(Math.min(widthScale, heightScale, harmonicScale) * compactBoost, MIN_SCALE, MAX_SCALE);

        document.documentElement.style.setProperty("--viewport-scale", scale.toFixed(4));
        return scale;
    }

    function getUsableInlineWidth() {
        var viewportWidth = window.innerWidth;
        var page = document.querySelector(".page");
        var computedStyle = page ? window.getComputedStyle(page) : null;
        var paddingLeft = computedStyle ? toPixels(computedStyle.paddingLeft) : 0;
        var paddingRight = computedStyle ? toPixels(computedStyle.paddingRight) : 0;

        return Math.max(1, viewportWidth - paddingLeft - paddingRight);
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

    function resolveIconWidth(items) {
        if (items.length === 0) {
            return 0;
        }

        var probe = createMeasureNode(items[0].className, "social-chip--measure");
        var width = Math.ceil(probe.getBoundingClientRect().width);

        probe.remove();
        return width;
    }

    function layoutLinkRows(root) {
        var items = Array.prototype.slice.call(root.querySelectorAll(".link-chip"));

        if (items.length === 0) {
            root.style.removeProperty("--uniform-link-width");
            return;
        }

        var availableWidth = Math.max(1, getUsableInlineWidth());
        var gap = getActualGap("link-row");
        var measuredWidth = measureLinkWidth(items);
        var maxItemsPerRow = items.length;
        var itemsPerRow = 1;

        for (var candidate = maxItemsPerRow; candidate >= 1; candidate -= 1) {
            var candidateWidth = (availableWidth - gap * Math.max(0, candidate - 1)) / candidate;
            if (candidateWidth >= measuredWidth) {
                itemsPerRow = candidate;
                break;
            }
        }

        var uniformWidth = measuredWidth;
        if (itemsPerRow > 1) {
            uniformWidth = Math.min(
                measuredWidth,
                Math.floor((availableWidth - gap * Math.max(0, itemsPerRow - 1)) / itemsPerRow)
            );
        }

        if (itemsPerRow === 1) {
            uniformWidth = measuredWidth;
        }

        var distribution = buildRowDistribution(items.length, itemsPerRow);

        root.style.setProperty("--uniform-link-width", Math.max(1, Math.ceil(uniformWidth)) + "px");
        root.dataset.rows = String(distribution.length);
        buildRows(root, items, "link-row", distribution);
    }

    function layoutSocialRows(root) {
        var items = Array.prototype.slice.call(root.querySelectorAll(".social-chip"));

        if (items.length === 0) {
            return;
        }

        var availableWidth = Math.max(1, getUsableInlineWidth());
        var gap = getActualGap("social-row");
        var iconWidth = resolveIconWidth(items);
        var maxItemsPerRow = items.length;
        var itemsPerRow = 1;

        for (var candidate = maxItemsPerRow; candidate >= 1; candidate -= 1) {
            var requiredWidth = candidate * iconWidth + Math.max(0, candidate - 1) * gap;
            if (requiredWidth <= availableWidth) {
                itemsPerRow = candidate;
                break;
            }
        }

        var distribution = buildRowDistribution(items.length, itemsPerRow);

        root.dataset.rows = String(distribution.length);
        buildRows(root, items, "social-row", distribution);
    }

    function updateScrollState(pageShell) {
        var viewportWidth = window.innerWidth;
        var viewportHeight = window.innerHeight;
        var shellWidth = Math.ceil(pageShell.scrollWidth);
        var shellHeight = Math.ceil(pageShell.scrollHeight);
        var documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, shellWidth);
        var documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, shellHeight);
        var allowHorizontal = documentWidth > viewportWidth + 1;
        var allowVertical = documentHeight > viewportHeight + 1;

        document.body.classList.toggle("has-horizontal-overflow", allowHorizontal);
        document.body.classList.toggle("has-vertical-overflow", allowVertical);
        pageShell.classList.toggle("has-horizontal-overflow", allowHorizontal);
        pageShell.classList.toggle("has-vertical-overflow", allowVertical);
    }

    function createLayoutController(config) {
        var frameId = 0;
        var resizeObserver = null;
        var linkRoot = config.linkRoot;
        var socialRoot = config.socialRoot;
        var pageShell = config.pageShell;

        function run() {
            frameId = 0;
            syncViewportScale();
            pageShell.style.width = "max-content";
            layoutLinkRows(linkRoot);
            layoutSocialRows(socialRoot);
            pageShell.style.width = "";
            updateScrollState(pageShell);
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
            resizeObserver.observe(pageShell);
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
