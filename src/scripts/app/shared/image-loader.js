(function (window) {
    "use strict";

    var namespace = window.SakuraHomepage || (window.SakuraHomepage = {});

    function decodeImage(image) {
        if (typeof image.decode !== "function") {
            return Promise.resolve();
        }

        return image.decode().catch(function () {
            return undefined;
        });
    }

    function loadImage(source) {
        return new Promise(function (resolve, reject) {
            var image = new Image();

            function cleanup() {
                image.onload = null;
                image.onerror = null;
            }

            image.onload = function () {
                decodeImage(image)
                    .then(function () {
                        cleanup();
                        resolve(image);
                    })
                    .catch(function (error) {
                        cleanup();
                        reject(error);
                    });
            };

            image.onerror = function () {
                cleanup();
                reject(new Error("Image failed to load: " + source));
            };

            image.src = source;
        });
    }

    namespace.imageLoader = {
        load: loadImage
    };
})(window);
