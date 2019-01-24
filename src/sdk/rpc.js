const util = require('../misc/util.js');
const Context = require('./context.js');

const idChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function makeResult(id, state, data) {
    return {
        rpc: {
            id:    id,
            type:  'reply',
            state: state,
            data:  data == null ? null : data
        }
    };
}


module.exports = function rpc(streamdeck) {

    let $pending = {},
        $methods = {};


    function generateId() {
        let result = "";
        do {
            let i = 32;
            while (i--) {
                result += idChars[Math.floor(Math.random() * 62)];
            }
        } while (util.isKey($pending, result) && $pending[result] != null);
        return result;
    }

    Object.defineProperties(streamdeck, {
        register: {
            enumerable: true,
            value: function register(method, handler) {
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
            }
        },
        unregister: {
            enumerable: true,
            value: function unregister(method, handler) {
                if (!util.isString(method, {notEmpty: true})) {
                    throw new TypeError('invalid method argument');
                }
                if (!util.isKey($methods, method) || $methods[method] == null) {
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

    Object.defineProperties(Context.prototype, {
        invoke: {
            enumerable: true,
            value: function invoke(method, ...args) {
                let id = generateId();

                let invokePromise = new Promise((resolve, reject) => {
                    $pending[id] = {resolve: resolve, reject: reject};
                });

                $pending[id].timeout = setTimeout(function () {
                    let reject = $pending[id].reject;
                    delete $pending[id];

                    reject(new Error('invocation timed out'));
                }, 30000);

                this.send({
                    rpc: {
                        type:   "invoke",
                        method: method,
                        data:   args,
                        id:     id
                    }
                });

                return invokePromise;
            }
        },
        notify: {
            enumerable: true,
            value: function notify(event, data) {
                this.send({
                    rpc: {
                        type:  "notify",
                        event: event,
                        data:  data || {},
                        id:    "0"
                    }
                });
            }
        }
    });


    streamdeck.on('ready', function () {

        if (streamdeck.layer === 'propertyinspector') {
            Object.defineProperties(streamdeck, {
                invoke: {
                    enumerable: true,
                    value: function invoke(method, ...args) {

                        let id = generateId();

                        let invokePromise = new Promise((resolve, reject) => {
                            $pending[id] = {resolve: resolve, reject: reject};
                        });

                        $pending[id].timeout = setTimeout(function () {
                            let reject = $pending[id].reject;
                            delete $pending[id];

                            reject(new Error('invocation timed out'));
                        }, 30000);


                        streamdeck.sendToPlugin({
                            rpc: {
                                type:   "invoke",
                                method: method,
                                data:   args,
                                id:     id
                            }
                        });

                        return invokePromise;
                    }
                },
                notify: {
                    enumerable: true,
                    value: function notify(event, data) {
                        streamdeck.sendToPlugin({
                            rpc: {
                                type: 'notify',
                                event: event,
                                data:  data || {},
                                id:    "0"
                            }
                        });
                    }
                },
                getTitle: {
                    enumerable: true,
                    value: function () {
                        return this.invoke('INTERNAL:GetTitle');
                    }
                },
                setTitle: {
                    enumerable: true,
                    value: function (image, target) {
                        return this.invoke('INTERNAL:SeTitle', image, target);
                    }
                },
                getImage: {
                    enumerable: true,
                    value: function () {
                        return this.invoke('INTERNAL:GetImage');
                    }
                },
                setImage: {
                    enumerable: true,
                    value: function (image, target) {
                        return this.invoke('INTERNAL:SetImage', image, target);
                    }
                },
                getSettings: {
                    enumerable: true,
                    value: function () {
                        return this.invoke('INTERNAL:GetSettings');
                    }
                },
                setSettings: {
                    enumerable: true,
                    value: function (value) {
                        return this.invoke('INTERNAL:SetSettings', value);
                    }
                }
            });
        } else {
            streamdeck.register('INTERNAL:GetTitle', function (context) {
                return context.title;
            });
            streamdeck.register('INTERNAL:SetTitle', function (context, title, target) {
                context.setTitle(title, target);
                context.title.text = title;
                return context.title;
            });
            streamdeck.register('INTERNAL:GetImage', function () {
                throw new Error('GetImage not supported by streamdeck');
            });
            streamdeck.register('INTERNAL:SetImage', function (context, image, target) {
                context.setTitle(image, target);
                return context.title;
            });
            streamdeck.register('INTERNAL:GetSettings', function (context) {
                return context.settings;
            });
            streamdeck.register('INTERNAL:SetSettings', function (context, settings) {
                context.setSettings(settings);
                context.settings = settings;
                return context.settings;
            });
        }
    });
    streamdeck.on('streamdeck:messagerelay', function (evt) {

        let context = evt.data.context,
            data = evt.data.message;

        // basic validation
        if (
            data == null ||
            data.rpc == null ||
            !util.isString(data.rpc.type, {match: /^(?:invoke|reply|notify)$/}) ||
            !util.isString(data.rpc.id, {notEmpty: true})
        ) {
            return;
        }

        let rpc = evt.data.message.rpc;

        if (rpc.type === 'notify') {

            /*{
                id:    "0",
                type:  "notify",
                event: "...",
                data:  ...
            }*/

            if (rpc.id !== "0" || !util.isString(rpc.event, {notEmpty: true})) {
                return;
            }

            if (streamdeck.layer === 'plugin') {
                streamdeck.emit(`streamdeck:notify:${rpc.event}`, {context: context, data: rpc.data});

            } else {
                streamdeck.emit(`streamdeck:notify:${rpc.event}`, rpc.data);
            }

        } else if (!util.isString(rpc.id, {match: /^(?:[a-z\d]{32})$/i})) {
            return;


        } else if (rpc.type === 'reply') {

            /*{
                id:     "...",
                type:   "reply",
                state:  "ok"|"error",
                data:   ...|'error message'
            }*/

            if (rpc.state !== 'ok' && rpc.state !== 'error') {
                return;
            }
            if (!util.isKey($pending, rpc.id) || $pending[rpc.id] == null) {
                return;
            }

            let invokePromise = $pending[rpc.id],
                resolve = invokePromise.resolve,
                reject = invokePromise.reject;

            clearTimeout(invokePromise.timeout);
            delete $pending[rpc.id];

            if (rpc.state === 'ok') {
                resolve(rpc.data);

            } else {
                reject(new Error(rpc.data));
            }

        } else if (rpc.type === 'invoke') {

            /*{
                id:     "...",
                type:   "invoke",
                method: "...",
                data:   ...
            }*/

            if (!util.isString(rpc.method, {notEmpty: true})) {
                return;
            }

            if (!util.isKey($methods, rpc.method) || $methods[rpc.method] == null) {
                let result = makeResult(rpc.id, 'error', 'method not registered');
                if (streamdeck.layer === 'plugin') {
                    context.send(result);

                } else {
                    streamdeck.sendToPlugin(result);
                }

            } else {

                let args = rpc.data == null ? [] : rpc.data;
                if (!util.isArray(args)) {
                    args = [args];
                }

                try {
                    let methodResult;
                    if (streamdeck.layer === 'plugin') {
                        methodResult = $methods[rpc.method].call(streamdeck, context, ...args);
                    } else {
                        methodResult = $methods[rpc.method].call(streamdeck, ...args);
                    }

                    if (!(methodResult instanceof Promise)) {
                        methodResult = Promise.resolve(methodResult);
                    }

                    methodResult
                        .then(
                            res => {
                                let result = makeResult(rpc.id, 'ok', res);


                                if (streamdeck.layer === 'plugin') {
                                    context.send(result);
                                } else {
                                    streamdeck.sendToPlugin(result);
                                }
                            },
                            err => {
                                let result = makeResult(rpc.id, 'error', err instanceof Error ? err.message : String(err) === err ? err : 'unknown error');

                                if (streamdeck.layer === 'plugin') {
                                    context.send(result);
                                } else {
                                    streamdeck.sendToPlugin(result);
                                }
                            }
                        )
                        .catch(err => {
                            let result = makeResult(rpc.id, 'error', err instanceof Error ? err.message : String(err) === err ? err : 'unknown error');
                            if (streamdeck.layer === 'plugin') {
                                context.send(result);
                            } else {
                                streamdeck.sendToPlugin(result);
                            }
                        });
                } catch (err) {
                    let result = makeResult(rpc.id, 'error', err.message);
                    if (streamdeck.layer === 'plugin') {
                        context.send(result);
                    } else {
                        streamdeck.sendToPlugin(result);
                    }
                }
            }

        } else {
            return;
        }

        evt.stop();
    });
};