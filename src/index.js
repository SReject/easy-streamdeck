const util       = require('./common/utils.js');
const Connection = require('./common/connection.js');

const background = require('./background');
const foreground = require('./foreground');

const $ready      = Symbol('ready');
const $port       = Symbol('port');
const $id         = Symbol('instance identifier');
const $register   = Symbol('registerEvent');
const $layer      = Symbol('layer');
const $host       = Symbol('host');
const $deviceList = Symbol('device list');

/**
 * @class StreamDeck
 * @classdesc StreamDeck API handler
 * @extends {Connection}
*/
class StreamDeck extends Connection {

    /**
     * @desc Adds an event listener
     * @param {string} event The event name to attach to
     * @param {function} handler The callback function to call when the event occurs
     * @param {boolean} [once=false] If true, after the event is emitted the handler will be removed
     * @memberof StreamDeck
     * @instance
     * @return {this}
    */
    on(event, handler, once) {
        if (event === 'ready') {
            if (this.ready) {
                handler.call(this);
                return;
            }
            once = true;
        }
        return super.on(event, handler, once);
    }

    /**
     * @desc Removes the event listener. All parameters must match those used to create the listener
     * @memberof StreamDeck
     * @instance
     * @param {string} event The event name to attach to
     * @param {function} handler The callback function to call when the event occurs
     * @param {boolean} [once=false] If true, after the event is emitted the handler will be removed
     * @return {this}
    */
    off(event, handler, once) {
        if (event === 'ready') {
            once = true;
        }
        return super.off(event, handler, once);
    }

    constructor() {
        super();
        Object.defineProperty(this, $ready, {writable: true, value: false});

        Object.defineProperties(this, {
            /**
             * The ready state of the StreamDeck instance.
             *
             * true if ready, false if not
             * @name StreamDeck#ready
             * @instance
             * @type {boolean}
             * @readonly
             */
            ready: {
                enumerable: true,
                get: function () {
                    return this[$ready];
                }
            },

            /**
             * The port to use to connect to Stream Deck's software
             * @name StreamDeck#port
             * @instance
             * @type {boolean}
             * @readonly
             */
            port: {
                enumerable: true,
                get: function () {
                    return this[$id];
                }
            },
            id: {
                enumerable: true,
                get: function () {
                    return this[$id];
                }
            },
            layer: {
                enumerable: true,
                get: function () {
                    return this[$layer];
                }
            },
            host: {
                enumerable: true,
                get: function () {
                    return Object.assign({}, this[$host]);
                }
            },
            devices: {
                enumerable: true,
                get: function () {
                    return JSON.parse(JSON.stringify(this[$deviceList]));
                }
            }
        });
    }

    openUrl(url) {
        if (!util.isString(url, {notEmpty: true})) {
            throw new TypeError('invalid url');
        }

        this.send({
            event: "openUrl",
            payload: { url: url }
        });
    }

    start(port, id, register, hostinfo, selfinfo) {

        if (this[$ready] !== false) {
            throw new Error('start() function already called');
        }
        let readyDesc = Object.getOwnPropertyDescriptor(this, $ready);
        readyDesc.value = true;
        readyDesc.writable = false;

        /*
        ** ARGUMENT VALIDATION
        */

        // Validate port
        if (util.isString(port, {match: /^\d+$/i})) {
            port = Number(port);
        }
        if (!util.isNumber(port, {whole: true, min: 0, max: 65535})) {
            throw new TypeError('invalid port argument');
        }

        // Validate uuid
        if (!util.isString(id, {match: /^(?:(?:[A-F\d]+-){4}[A-F\d]+)$/})) {
            throw new TypeError('invalid uuid argument');
        }

        // Validate registerEvent
        if (!util.isString(register, {match: /^register(?:Plugin|PropertyInspector)$/})) {
            throw new TypeError('invalid registerEvent argument');
        }

        // Process host as JSON if its a string
        if (util.isString(hostinfo)) {
            try {
                hostinfo = JSON.parse(hostinfo);
            } catch (e) {
                throw new TypeError('invalid hostInfo argument');
            }
        }

        // Validate hostinfo
        if (
            hostinfo == null ||
            !util.isKey(hostinfo, 'application') ||
            !util.isKey(hostinfo.application, 'language') ||
            !util.isString(hostinfo.application.language) ||
            !util.isKey(hostinfo.application, 'platform') ||
            !util.isString(hostinfo.application.platform) ||
            !util.isKey(hostinfo.application, 'version') ||
            !util.isString(hostinfo.application.version) ||
            !util.isKey(hostinfo, 'devices') ||
            !util.isArray(hostinfo.devices)
        ) {
            throw new TypeError('invalid environment argument');
        }

        let deviceList = {};
        hostinfo.devices.forEach(device => {
            if (
                device == null ||
                !util.isString(device.id, {match: /^[A-F\d]{32}$/}) ||
                device.size == null ||
                !util.isNumber(device.size.rows, {whole: true, min: 1}) ||
                !util.isNumber(device.size.columns, {whole: true, min: 1}) ||
                (device.type != null && !util.isNumber(device.type, {whole: true, min: 0}))
            ) {
                throw new TypeError('invalid device list');
            }

            // add the validated device to the deviceList
            deviceList[device.id] = {
                id:      device.id,
                rows:    device.size.rows,
                columns: device.size.columns,
                type:    device.type
            };
        });

        // If foreground, validate selfinfo
        if (register === 'registerPropertyInspector') {

            // If string, convert to object
            if (util.isString(selfinfo)) {
                try {
                    selfinfo = JSON.parse(selfinfo);
                } catch (e) {
                    throw new TypeError('invalid selfInfo argument');
                }
            }

            // Validate selfinfo
            if (
                selfinfo == null ||
                !util.isString(selfinfo.context, {match: /^[A-F\d]{32}$/}) ||
                !util.isString(selfinfo.action, {notEmpty: true})
            ) {
                throw new TypeError('invalid selfInfo argument');
            }

        // If background, selfinfo should be null
        } else if (selfinfo != null) {
            throw new TypeError('selfinfo specified for plugin');
        }
        /*
        ** VALIDATION COMPLETE
        */
        Object.defineProperty(this, $port,       {value: port});
        Object.defineProperty(this, $id,         {value: id});
        Object.defineProperty(this, $register,   {value: register});
        Object.defineProperty(this, $layer,      {value: register === 'registerPlugin' ? 'plugin' : 'propertyinspector'});
        Object.defineProperty(this, $host,       {value: hostinfo.application});
        Object.defineProperty(this, $deviceList, {value: deviceList});

        // Start based on register value
        if (this[$layer] === 'plugin') {
            background(this, deviceList);

        } else {
            foreground(this, selfinfo);
        }

        // start connection to Stream Deck
        this.connect(`ws://localhost:${port}`);
        this.on('websocket:connect', function (evt) {
            this.send({
                event: register,
                uuid:  id
            });
            evt.stop();
        });

        // emit ready event
        this.emit('ready');
    }
}

module.exports = StreamDeck;