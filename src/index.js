const util       = require('./misc/util.js');
const Emitter    = require('./misc/emitter.js');
const Connection = require('./sdk/connection.js');
const Context    = require('./sdk/context.js');
const messages   = require('./sdk/messages.js');
const rpc        = require('./sdk/rpc.js');



const streamdeck = new Emitter();


let $ready = false,
    $port,
    $uuid,
    $layer,
    $host,
    $devices   = {},
    $contexts  = {},
    $onmessage = messages(streamdeck, $devices, $contexts),
    $conn      = new Connection();

// Members common to all layers
Object.defineProperties(streamdeck, {

    /* Read only properties */
    ready:   {enumerable: true, get: () => $ready},
    port:    {enumerable: true, get: () => $port},
    uuid:    {enumerable: true, get: () => $uuid},
    layer:   {enumerable: true, get: () => $layer},
    host:    {enumerable: true, get: () => $host},
    devices: {enumerable: true, get: () => {
        let res = [];
        Object.keys($devices).forEach(id => {
            if ($devices[id] != null) {
                res.push(Object.assign(Object.create(null), $devices[id]));
            }
        });
        return res;
    }},

    /* Read only methods */
    send: {
        enumerable: true,
        value: function send(data) {
            return $conn.send(data);
        }
    },
    sendJSON: {
        enumerable: true,
        value: function sendJSON(data) {
            return $conn.sendJSON(data);
        }
    },
    openUrl: {
        enumerable: true,
        value: function openUrl(url) {
            if (!util.isString(url, {notEmpty: true})) {
                throw new TypeError('invalid url');
            }
            $conn.sendJSON({
                event: "openUrl",
                payload: { url: url }
            });
        }
    },

    /* Initialization function */
    start: {
        enumerable: true,
        value: function init(port, uuid, registerEvent, host, context) {

            // streamdeck.start already called
            if ($ready) {
                throw new Error('start() function already called');
            }
            $ready = true;

            // validate port
            if (util.isString(port, {match: /^\d+$/i})) {
                port = Number(port);
            }
            if (!util.isNumber(port, {whole: true, min: 0, max: 65535})) {
                throw new TypeError('invalid port argument');
            }

            // validate uuid
            if (!util.isString(uuid, {notEmpty: true})) {
                throw new TypeError('invalid uuid argument');
            }

            // validate registerEvent
            if (!util.isString(registerEvent, {match: /^register(?:Plugin|PropertyInspector)$/})) {
                throw new TypeError('invalid registerEvent argument');
            }

            // Process host as JSON if its a string
            if (util.isString(host)) {
                try {
                    host = JSON.parse(host);
                } catch (e) {
                    throw new TypeError('invalid hostInfo argument');
                }
            }

            // Validate hostInfo ("inInfo")
            if (
                host == null ||
                !util.isKey(host, 'application') ||
                !util.isKey(host.application, 'language') ||
                !util.isString(host.application.language) ||
                !util.isKey(host.application, 'platform') ||
                !util.isString(host.application.platform) ||
                !util.isKey(host.application, 'version') ||
                !util.isString(host.application.version) ||
                !util.isKey(host, 'devices') ||
                !util.isArray(host.devices)
            ) {
                throw new TypeError('invalid environment argument');
            }

            // Process host.devices
            let deviceList = {};
            host.devices.forEach(device => {

                // Validate device
                if (
                    device == null ||
                    !util.isString(device.id, {match: /^[A-F\d]{32}$/}) ||
                    (device.type != null && !util.isNumber(device.type, {whole: true, min: 0})) ||
                    device.size == null ||
                    !util.isNumber(device.size.columns, {whole: true, min: 1}) ||
                    !util.isNumber(device.size.rows, {whole: true, min: 1})
                ) {
                    throw new TypeError('invalid device list');
                }

                // Store the device
                deviceList[device.id] = {
                    id: device.id,
                    type: device.type,
                    columns: device.size.columns,
                    rows: device.size.rows
                };
            });

            // Check: loaded as a Property Inspector instance
            if (registerEvent === 'registerPropertyInspector') {

                // Process context as JSON if its a string
                if (util.isString(context)) {
                    try {
                        context = JSON.parse(context);
                    } catch (e) {
                        throw new TypeError('invalid contextInfo argument');
                    }
                }

                // Validate contextInfo ("inApplicationInfo")
                if (context == null || !util.isString(context.context, {match: /^[A-F\d]{32}$/}) || !util.isString(context.action, {notEmpty: true})) {
                    throw new TypeError('invalid contextInfo argument');
                }
            }

            $port    = port;
            $uuid    = uuid;
            $host    = host.application;
            $devices = deviceList;
            $layer   = registerEvent === 'registerPlugin' ? 'plugin' : 'propertyinspector';


            // layer-based loading
            if ($layer === 'propertyinspector') {
                Object.defineProperties(streamdeck, {
                    contextId: {enumerable: true, value: context.context},
                    actionId:  {enumerable: true, value: context.action},
                    sendToPlugin: {
                        enumerable: true,
                        value: function sendToPlugin(data) {
                            streamdeck.sendJSON({
                                event:  "sendToPlugin",
                                action:  streamdeck.actionId,
                                context: streamdeck.uuid,
                                payload: data
                            });
                        }
                    }
                });

            } else {
                Object.defineProperties(streamdeck, {
                    switchToProfile: {
                        enumerable: true,
                        value: function switchToProfile(profileName) {
                            if (!util.isString(profileName)) {
                                throw new TypeError('invalid profileName argument');
                            }
                            streamdeck.sendJSON({
                                event: "switchToProfile",
                                context: streamdeck.uuid,
                                payload: {profile: profileName}
                            });
                        }
                    },
                    createContext: {
                        enumerable: true,
                        value: function createContext(action, contextId) {
                            return new Context(streamdeck, action, contextId);
                        }
                    },
                    contexts: {
                        enumerable: true,
                        get: function () {
                            let result = [];
                            Object.keys($contexts).forEach(id => {
                                if ($contexts[id] != null) {
                                    result.push($contexts[id].toSafe());
                                }
                            });

                            return result;
                        }
                    }
                });
            }

            // start connecting
            $conn.on('message', $onmessage);
            $conn.on('message', function (evt) {
                streamdeck.emit('websocket:message', evt.data);
            });
            $conn.connect(port, uuid, registerEvent);

            // emit ready event
            streamdeck.emit('ready', null, {stoppable: false, suppressError: true});
        }
    }
});

// call rpc handler
rpc(streamdeck);

// hook websocket events to re-emit on the streamdeck instance
$conn.on('connect', function () {
    streamdeck.emit('websocket:connect');
});
$conn.on('close', function (evt) {
    streamdeck.emit('websocket:close', evt);
});
$conn.on('error', function (evt) {
    streamdeck.emit('websocket:error', evt);
});
module.exports = streamdeck;