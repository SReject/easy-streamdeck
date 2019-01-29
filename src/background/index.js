const util      = require('../common/utils.js');
const irnClient = require('../common/irn-client.js');
const onmessage = require('./onmessage.js');
const context   = require('./context.js');

function background(streamdeck, deviceList) {

    const contextList = {};
    const irn = irnClient(streamdeck);

    // Add background-related properties to streamdeck
    Object.defineProperties(streamdeck, {
        onMessage: {
            value: onmessage.call(streamdeck, deviceList, contextList)
        },
        contexts: {
            enumerable: true,
            get: function () {
                return Object.assign({}, contextList);
            }
        },
        switchToProfile: {
            enumerable: true,
            value: function switchToProfile(profile, device) {
                if (!util.isString(profile)) {
                    throw new Error('invalid profile argument');
                }
                this.send({
                    event: "switchToProfile",
                    context: this.id,
                    device: device,
                    payload: {
                        profile: profile
                    }
                });
            }
        },
        Context: {
            enumerable: true,
            value: context(streamdeck)
        }
    });

    // Add IRN client related properties to the Context class
    Object.defineProperties(streamdeck.Context, {
        invoke: {
            enumerable: true,
            value: function invoke(method, ...args) {
                let res = irn.invoke(method, ...args);
                this.send(res.result);
                return res.promise;
            }
        },
        notify: {
            enumerable: true,
            value: function notify(event, ...args) {
                this.send(irn.notify(event, ...args));
            }
        }
    });

    // register foreground-invokable methods
    irn.register('$getTitle', function () {
        return this.title;
    });
    irn.register('$setTitle', function (title, target) {
        this.setTitle(title, target);
        return this.title.text;
    });
    irn.register('$getImage', function () {
        throw new Error('not supported');
    });
    irn.register('$setImage', function (image, target) {
        this.setImage(image, target);
    });
    irn.register('$getState', function () {
        return this.state;
    });
    irn.register('$setState', function (state) {
        this.setState(state);
        this.state = state;
    });
    irn.register('$getSettings', function () {
        return this.settings;
    });
    irn.register('$setSettings', function (settings) {
        this.setSettings(settings);
        return this.settings;
    });
}

module.exports = background;