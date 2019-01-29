const Streamdeck = require('./src/');

if (typeof window === 'object' && typeof document === 'object') {
    window.streamdeck = new Streamdeck();
    window.connectSocket = window.streamdeck.start.bind(window.streamdeck);

} else {

    console.log(typeof window, window === this, typeof document);

    module.exports = Streamdeck;
}