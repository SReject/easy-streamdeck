const streamdeck = require('./src');

// Running in a browser-esq context
if (window != null && window.navigator != null && window.navigator === navigator && String(navigator.appVersion) === navigator.appVersion) {

    // Add streamdeck to the window instance
    Object.defineProperty(window, 'streamdeck', {
        enumerable: true,
        value: streamdeck
    });

    // Elgato Streamdeck plugin environment
    if (navigator.appVersion.includes('QtWebEngine')) {

        // Add the connectSocket handler to the global scope
        Object.defineProperty(window, 'connectSocket', {
            value: streamdeck.start
        });
    }
}

module.exports = streamdeck;