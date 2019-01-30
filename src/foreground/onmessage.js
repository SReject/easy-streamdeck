const util = require('../common/utils.js');

function onmessage(evt) {

    // Retrieve message data
    let msg = evt.data;

    // Message null or doesn't appear to be a JSON object string
    if (msg == null || !util.isString(msg, {match: /^\{[\s\S]+\}$/})) {
        return this.emit('websocket:message', evt.data);
    }

    // Attempt to parse the msg
    try {
        msg = JSON.parse(msg);
    } catch (ignore) {
        return this.emit('websocket:message', evt.data);
    }

    // Streamdeck messages sent to the foreground will always have an event property of 'sendToPropertyInspector'
    if (!util.isString(msg.event, {match: /^sendToPropertyInspector$/})) {
        return this.emit('websocket:message', evt.data);
    }

    // emit the received event as a 'message' event
    this.emit('message', msg.payload);
}

module.exports = onmessage;