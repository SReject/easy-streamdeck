const Emitter = require('./emitter.js');
const {WebSocket} = require('./boilers.js');

const $websock          = Symbol('ws connection');
const $readyState       = Symbol('ws readyState');
const $spooledMessages  = Symbol('ws spooled messages');
const $reconnectTimeout = Symbol('ws reconnect timeout');
const $reconnectDelay   = Symbol('ws reconnect delay');
const $addressKey       = Symbol('ws address key');

let onConnect = false;

function cleanup(self) {
    if (self[$websock] != null) {
        if (self[$websock].readyState < 2) {
            self[$websock].close();
        }
        self[$websock].onopen    = null;
        self[$websock].onmessage = null;
        self[$websock].onclose   = null;
        self[$websock].onerror   = null;
        self[$websock]           = null;
        self[$readyState]        = 0;
    }
    if (self[$reconnectTimeout]) {
        clearTimeout(self[$reconnectTimeout]);
    }
}
function reconnect(self) {
    self[$readyState] = 1;

    // Start a timeout that will attempt to connect when it elapses
    self[$reconnectTimeout] = setTimeout(self.connect.bind(self), self[$reconnectDelay]);

    // Decay the timeout delay
    self[$reconnectDelay] *= 1.5;
    if (self[$reconnectDelay] > 30000) {
        self[$reconnectDelay] = 30000;
    }
}

class Connection extends Emitter {

    constructor() {
        super();

        Object.defineProperty(this, $websock, {writable: true, value: null});
        Object.defineProperty(this, $readyState, {writable: true, value: 0});
        Object.defineProperty(this, $reconnectDelay, {writable: true, value: 1000});
        Object.defineProperty(this, $spooledMessages, {writable: true, value: []});
    }

    // Overridable websocket on-open event handler
    onOpen() {

        // Reset reconnect timeout
        if (this[$reconnectTimeout]) {
            clearTimeout(this[$reconnectTimeout]);
            this[$reconnectTimeout] = null;
            this[$reconnectDelay] = 1000;
        }

        // emit connect event
        this[$readyState] = 2;
        onConnect = true;
        this.emit('websocket:connect');
        onConnect = false;

        // send spooled messages
        if (this[$spooledMessages].length) {
            this[$spooledMessages].forEach(msg => this[$websock].send(msg));
            this[$spooledMessages] = [];
        }

        // emit ready event
        this[$readyState] = 3;
        this.emit('websocket:ready');
    }

    // Overridable websocket on-message event handler
    onMessage(evt) {
        this.emit('websocket:message', evt.data);
    }

    // Overridable websocket on-close event handler
    onClose(evt) {

        // deduce close reason and emit event
        let reason;
        switch (evt.code) {
        case 1000:
            reason = 'Normal Closure. The purpose for which the connection was established has been fulfilled.';
            break;
        case 1001:
            reason = 'Going Away. An endpoint is "going away", such as a server going down or a browser having navigated away from a page.';
            break;
        case 1002:
            reason = 'Protocol error. An endpoint is terminating the connection due to a protocol error';
            break;
        case 1003:
            reason = "Unsupported Data. An endpoint received a type of data it doesn't support.";
            break;
        case 1004:
            reason = '--Reserved--. The specific meaning might be defined in the future.';
            break;
        case 1005:
            reason = 'No Status. No status code was actually present.';
            break;
        case 1006:
            reason = 'Abnormal Closure. The connection was closed abnormally, e.g., without sending or receiving a Close control frame';
            break;
        case 1007:
            reason = 'Invalid frame payload data. The connection was closed, because the received data was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629]).';
            break;
        case 1008:
            reason = 'Policy Violation. The connection was closed, because current message data "violates its policy". This reason is given either if there is no other suitable reason, or if there is a need to hide specific details about the policy.';
            break;
        case 1009:
            reason = 'Message Too Big. Connection closed because the message is too big for it to process.';
            break;
        case 1010:
            reason = "Mandatory Ext. Connection is terminated the connection because the server didn't negotiate one or more extensions in the WebSocket handshake. Mandatory extensions were: " + evt.reason;
            break;
        case 1011:
            reason = 'Internl Server Error. Connection closed because it encountered an unexpected condition that prevented it from fulfilling the request.';
            break;
        case 1015:
            reason = "TLS Handshake. The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
            break;
        default:
            reason = 'Unknown reason';
            break;
        }

        // cleanup connection
        cleanup(this);

        // emit close event
        this.emit(`websocket:close`, {code: evt.code, reason: reason});

        // Start reconnection
        reconnect(this);
    }

    // Override able websocket on-error event handler
    onError() {

        // cleanup
        cleanup(this);

        // emit error event
        this.emit('websocket:error');

        // Start delayed reconnect
        reconnect(this);
    }


    // starts connection to address
    connect(address) {
        if (this[$websock]) {
            return this;
        }

        if (address != null) {
            if (this[$addressKey] == null) {
                Object.defineProperty(this, $addressKey, {value: address});
            } else {
                this[$addressKey] = address;
            }
        }

        this[$readyState]        = 1;
        this[$websock]           = new WebSocket(this[$addressKey]);
        this[$websock].onopen    = this.onOpen.bind(this);
        this[$websock].onmessage = this.onMessage.bind(this);
        this[$websock].onerror   = this.onError.bind(this);
        this[$websock].onclose   = this.onClose.bind(this);

        return this;
    }

    // All data sent should be JSON strings
    send(data) {
        data = JSON.stringify(data);

        if (
            onConnect === true ||
            (this[$readyState] === 3 && !this[$spooledMessages].length)) {
            this[$websock].send(data);
        } else {
            this[$spooledMessages].push(data);
        }
        return this;
    }
}

module.exports = Connection;