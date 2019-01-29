const util = require('./utils.js');

const idChars  = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const reserved = "0".repeat(32);

function format(id, type, meta, data) {
    return {
        irn: {
            id:   id,
            type: type,
            meta: meta,
            data: data == null ? null : data
        }
    };
}

function irnClient(streamdeck) {
    let $pending = {},
        $methods = {};

    const genId = function () {
        let result = "";
        do {
            let i = 32;
            while (i--) {
                result += idChars[Math.floor(Math.random() * 62)];
            }
        } while (result !== reserved && $pending[result] != null);
        return result;
    };

    const registerMethod = function register(method, handler) {
        if (!util.isString(method, {notEmpty: true})) {
            throw new TypeError('invalid method argument');
        }
        if (!util.isCallable(handler)) {
            throw new TypeError('invalid handler argument');
        }
        if (util.isKey($methods, method) && $methods[method] != null) {
            throw new TypeError('method already registered');
        }
        $methods[method] = handler;
    };

    Object.defineProperties(streamdeck, {
        register: {
            enumerable: true,
            value: function register(...args) {
                if (util.isString(args[0], {match: /^\$/})) {
                    throw new TypeError('invalid method argument');
                }
                registerMethod(...args);
            }
        },
        unregister: {
            enumerable: true,
            value: function unregister(method, handler) {
                if (!util.isString(method, {notEmpty: true, matches: /^[^$]/})) {
                    throw new TypeError('invalid method argument');
                }
                if ($methods[method] == null) {
                    return;
                }
                if (!util.isCallable(handler)) {
                    throw new TypeError('invalid handler argument');
                }
                if ($methods[method] !== handler) {
                    throw new TypeError('handler does not match registered handler');
                }

                delete $methods[method];
            }
        }
    });

    streamdeck.on('message', function (evt) {

        let data = evt.data,
            info;

        // basic validation
        if (
            data == null ||
            data.irn == null ||
            !util.isString(data.irn.id, {match: /^(?:[a-z\d]{32})/i}) ||
            !util.isString(data.irn.type, {match: /^(?:invoke|response|notify)$/}) ||
            !util.isString(data.irn.meta, {notEmpty: true}) ||
            !util.isKey(data.irn, 'data')
        ) {
            return;
        }

        data = evt.data.irn;

        const sendProp = streamdeck.layer === 'plugin' ? 'send' : 'sendToPlugin';
        switch (data.type) {

        case 'notify':
            if (data.id !== reserved) {
                return;
            }
            streamdeck.emit(`notify:${data.meta}`, data.data);
            break;

        case 'response':
            if ($pending[data.id] == null) {
                return;
            }

            info = $pending[data.id];
            delete $pending[data.id];

            clearTimeout(info.timeout);

            if (data.meta === 'ok') {
                info.resolve(data.data);
            } else if (data.meta === 'error') {
                info.reject(new Error(data.data));
            } else {
                info.reject(new Error('invalid state received'));
            }
            break;

        case 'invoke':
            if ($methods[data.meta] == null) {
                this[sendProp](format(data.id, 'response', 'error', 'method not registered'));

            } else if (!util.isArray(data.data)) {
                this[sendProp](format(data.id, 'response', 'error', 'invalid arguments'));

            } else {
                try {
                    info = $methods[data.meta].call(this, ...data.data);
                    if (!(info instanceof Promise)) {
                        info = Promise.resolve(info);
                    }

                    info
                        .then(
                            res => {
                                this[sendProp](format(data.id, 'response', 'ok', res));
                            },
                            err => {
                                this[sendProp](format(
                                    data.id,
                                    'response',
                                    'error',
                                    err instanceof Error ? err.message : String(err) === err ? err : 'unknown error'
                                ));
                            }
                        )
                        .catch(err => {
                            this[sendProp](format(
                                data.id,
                                'response',
                                'error',
                                err instanceof Error ? err.message : String(err) === err ? err : 'unknown error'
                            ));
                        });

                } catch (err) {
                    this[sendProp](format(data.id, 'response', 'error', err.message));
                }
            }
            break;
        }
        evt.stop();
    });


    return {
        invoke: function (method, ...args) {
            let id = genId();

            return {
                promise: new Promise((resolve, reject) => {
                    $pending[id] = {
                        resolve: resolve,
                        reject:  reject,
                        timeout: setTimeout(function () {
                            delete $pending[id];
                            reject(new Error('invoke timed out'));
                        }, 30000)
                    };
                }),
                result: format(id, 'invoke', method, args)
            };
        },
        notify: function (event, data) {
            return format(reserved, 'notify', event, data);
        },
        register: registerMethod
    };
}

module.exports = irnClient;