const util = require('./utils.js');

const $eventListenersKey = Symbol('event listeners');

class Emitter {
    constructor() {
        Object.defineProperty(this, $eventListenersKey, {value: {}});
    }

    on(event, handler, isOnce) {

        // Validate event
        if (!util.isString(event, {notEmpty: true})) {
            throw new TypeError('invalid name argument');
        }

        // Validate handler
        if (!util.isCallable(handler)) {
            throw new TypeError('invalid handler argument');
        }

        // Validate isOneTimeHandler
        if (isOnce != null && !util.isBoolean(isOnce)) {
            throw new TypeError('invalid isOnce argument');
        }

        // Create a list of event handlers for the event if one does not exist
        if (this[$eventListenersKey][event] == null) {
            this[$eventListenersKey][event] = [];
        }

        // Store the handler
        this[$eventListenersKey][event].push({
            handler: handler,
            once: isOnce == null ? false : isOnce
        });

        // Return instance to enable chaining
        return this;
    }

    off(event, handler, isOnce) {

        // validate event
        if (!util.isString(event, {notEmpty: true})) {
            throw new TypeError('invalid name argument');
        }

        // validate handler
        if (!util.isCallable(handler)) {
            throw new TypeError('invalid handler argument');
        }

        // validate isOneTimeHandler
        if (isOnce != null && !util.isBoolean(isOnce)) {
            throw new TypeError('invalid isOneTimeHandler argument');
        }

        let listeners = self[$eventListenersKey][event];

        // event does not have registered listeners so nothing left to do
        if (listeners == null || !listeners.length) {
            return;
        }

        // find
        let idx = listeners.length;
        do {
            idx -= 1;

            // get listener instance
            let listener = listeners[idx];

            // Check: listener instance matches the inputs
            if (listener.handler === handler && listener.once === isOnce) {

                // remove the listener and exit looping
                listeners.splice(idx, 1);
                break;
            }
        } while (idx > 0);

        // Return instance to enable chaining
        return this;
    }

    once(event, handler) {
        return this.on(event, handler, true);
    }

    nonce(event, handler) {
        return this.off(event, handler, true);
    }

    emit(event, data, options) {

        // Validate inputs
        if (!util.isString(event, {notEmpty: true})) {
            throw new TypeError('invalid event name');
        }

        // No listeners for event
        if (
            this[$eventListenersKey] == null ||
            this[$eventListenersKey][event] == null ||
            this[$eventListenersKey][event].length === 0
        ) {
            return this;
        }

        options = options == null ? {} : options;

        let self      = this,
            listeners = this[$eventListenersKey][event],
            stopped   = false,
            evt       = Object.create(null),
            idx       = 0;

        Object.defineProperties(evt, {
            stop: {
                enumerable: true,
                value: function stop() {
                    stopped = true;
                }
            },
            data: {
                enumerable: true,
                value: data
            }
        });

        while (idx < listeners.length) {

            // Retrieve next listener for the event
            let listener = listeners[idx];

            // Listener is a one-time handler
            if (listener.once) {

                // Remove the handler from the event's listeners list
                listeners.splice(idx, 1);

            } else {
                idx += 1;
            }

            // Attempt to call handler
            listener.handler.call(options.self != null ? options.self : self, evt);

            // Listener called .stop() - exit processing
            if (stopped && options.stoppable !== false) {
                break;
            }
        }

        // return instance to enable chaining
        return this;
    }
}

module.exports = Emitter;