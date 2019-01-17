const util = require('./util.js');

const eventListenersKey = Symbol('event listeners');
const eventEmitQueueKey = Symbol('event emit queue');
const eventEmitTimeoutKey = Symbol('event emit timeout key');

const processEmitQueue = (self) => {

    // retrieve event queue for the instance
    let emitQueue = self[eventEmitQueueKey],

        // Retrieve next event to emit
        event = emitQueue.shift(),

        // Get list of handlers for the event
        listeners = self[eventListenersKey][event.name];

    // If there's more queued events to emit, start a new timeout
    if (emitQueue.length) {
        self[eventEmitTimeoutKey] = setTimeout(processEmitQueue, 1, self);

    // Otherwise null-out the timeout id
    } else {
        self[eventEmitTimeoutKey] = null;
    }

    // No registered event listeners for event
    if (listeners == null || !listeners.length) {
        return;
    }

    // Stopped tracking; set to true if the handler calls .stop()
    let stopped = false,
        eventData = Object.create(null);

    Object.defineProperties(eventData, {
        stop: {
            enumerable: true,
            value: function stop() {
                stopped = true;
            }
        },
        data: {
            enumerable: true,
            value: event.data
        }
    });

    let idx = 0;
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
        try {
            listener.handler.call(self, eventData);

            // Listener called .stop() - exit processing
            if (stopped && event.options.stoppable !== false) {
                return;
            }

        // Handler raised error
        } catch (err) {

            // options indicate that errors should not be suppressed
            if (!event.options.suppressErrors) {

                // rethrow error
                throw err;
            }
        }
    }
};

class Emitter {
    constructor() {
        this[eventListenersKey] = {};
        this[eventEmitQueueKey] = [];
        this[eventEmitTimeoutKey] = null;
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

        if (event === 'ready') {

            // ready event already triggered
            if (this.ready) {
                let self = this;
                setTimeout(function () {
                    handler.call(self);
                }, 1);
                return;
            }

            // otherwise 'ready' handlers are converted to one-time handler
            isOnce = true;
        }



        // Create a list of event handlers for the event if one does not exist
        if (this[eventListenersKey][event] == null) {
            this[eventListenersKey][event] = [];
        }

        // Store the handler
        this[eventListenersKey][event].push({
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

        let listeners = self[eventListenersKey][event];

        // event does not have registered listeners so nothing left to do
        if (listeners == null || !listeners.length) {
            return;
        }

        // ready event handler should be one-time event handlers
        if (event === 'ready') {
            isOnce = true;
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

        // Add emitter to processing queue
        this[eventEmitQueueKey].push({
            name: event,
            data: data,
            options: options == null ? {} : options
        });

        // Event processor not running so start it
        if (this[eventEmitTimeoutKey] == null) {
            this[eventEmitTimeoutKey] = setTimeout(processEmitQueue, 1, this);
        }

        // return instance to enable chaining
        return this;
    }
}

module.exports = Emitter;