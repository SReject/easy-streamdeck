const Emitter = require('../misc/emitter.js');

function cleanup(self) {
    self.connection.onopen =
        self.connection.onmessage =
        self.connection.onclose =
        self.connection.onerror = null;

    self.connection = null;
    self.readyState = 0;
}
function reconnect(self) {
    self.readyState = 1;

    self.reconnectTimeout = setTimeout(function () {
        self.connect(self.port, self.uuid, self.register);
    }, self.delay);

    self.delay *= 1.5;
    if (self.delay > 30000) {
        self.delay = 30000;
    }
}
function onOpen() {
    this.readyState = 2;
    this.connection.send(JSON.stringify({
        event: this.register,
        uuid: this.uuid
    }));
    this.delay = 1000;
    this.readyState = 3;
    this.emit('connect');

    if (this.spooled.length) {
        this.spooled.forEach(msg => this.connection.send(msg));
        this.spooled = [];
    }
}
function onMessage(evt) {
    this.emit('message', evt.data);
}
function onError(evt) {
    cleanup(this);

    this.emit('error', evt);

    reconnect(this);
}
function onClose(evt) {

    // cleanup connection
    cleanup(this);

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
        // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
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

    // emit close event
    this.emit(`close`, {code: evt.code, reason: reason});

    // attempt reconnection
    reconnect();
}

class Connection extends Emitter {
    constructor() {
        super();
        this.readyState = 0;
        this.reconnectDelay = 1000;
        this.reconnectDecay = 1.1;
        this.spooled = [];
        this.delay = 1000;
    }
    connect(port, uuid, register) {
        if (this.connection) {
            return;
        }
        this.port = port;
        this.uuid = uuid;
        this.register = register;
        this.readyState = 1;

        this.connection = new WebSocket(`ws://localhost:${port}`);
        this.connection.onopen    = onOpen.bind(this);
        this.connection.onmessage = onMessage.bind(this);
        this.connection.onerror   = onError.bind(this);
        this.connection.onclose   = onClose.bind(this);
    }
    send(data) {
        if (this.readyState === 3 && !this.spooled.length) {
            this.connection.send(data);
        } else {
            this.spooled.push(data);
        }
    }
    sendJSON(data) {
        this.send(JSON.stringify(data));
    }
    close() {
        if (this.connection) {
            this.connection.close();
            cleanup(this);
        }
    }
}

module.exports = Connection;