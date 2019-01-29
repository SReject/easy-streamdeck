// websocket class missing, use ws package
if (typeof WebSocket !== 'function') {
    exports.WebSocket = require('ws');
} else {
    exports.WebSocket = WebSocket;
}

// canvas missing, use image-data-uri package
if (typeof HTMLCanvasElement !== 'function') {
    exports.imageToDataURL = require('image-data-uri');
} else {
    exports.imageToDataURL = function (url) {
        return new Promise((resolve, reject) => {
            let image = new Image();

            image.onload = function () {
                let canvas = document.createElement('canvas');
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;

                // draw image on canvas
                let ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0);

                image.onload = null;
                image.onerror = null;
                image = null;

                resolve(canvas.toDataURL('image/png'));
            };
            image.onerror = function () {

                image.onload = null;
                image.onerror = null;
                image = null;

                reject(new Error('image failed to load'));
            };
            image.src = url;
        });
    };
}