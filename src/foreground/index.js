const onmessage = require('./onmessage.js');
const irnClient = require('../common/irn-client.js');

function foreground(streamdeck, selfinfo) {

    // Setup Foreground Invoke-Respond-Notify client
    let irn = irnClient(streamdeck);

    // Define foreground-specific properties to the streamdeck isntance
    Object.defineProperties(streamdeck, {

        // Override default on-message handler
        onMessage: {
            enumerable: true,
            value: onmessage
        },

        // Context and Action ids
        contextId: {
            enumerable: true,
            value: selfinfo.context
        },
        actionId: {
            enumerable: true,
            value: selfinfo.action
        },

        // Function to send data to background
        sendToPlugin: {
            enumerable: true,
            value: function sendToPlugin(data) {
                streamdeck.send({
                    event:   "sendToPlugin",
                    action:  streamdeck.actionId,
                    context: streamdeck.id,
                    payload: data
                });
            }
        },

        // IRN client related invoke and notify
        invoke: {
            enumerable: true,
            value: function invoke(method, ...args) {
                let res = irn.invoke(method, ...args);
                this.sendToPlugin(res.result);
                return res.promise;
            }
        },
        notify: {
            enumerable: true,
            value: function notify(event, ...args) {
                this.sendToPlugin(irn.notify(event, ...args));
            }
        },

        // get/setTitle functions
        getTitle: {
            enumerable: true,
            value: function getTitle() {
                return this.invoke('$getTitle');
            }
        },
        setTitle: {
            enumerable: true,
            value: function setTitle(title, target) {
                return this.invoke('$setTitle', title, target);
            }
        },

        // get/setImage functions
        getImage: {
            enumerable: true,
            value: function getImage() {
                return Promise.reject(new Error('not supported'));
            }
        },
        setImage: {
            enumerable: true,
            value: function setImage(image, target) {
                return this.invoke('$setImage', image, target);
            }
        },

        // get/setState functions
        getState: {
            enumerable: true,
            value: function getState() {
                return this.invoke('$getState');
            }
        },
        setState: {
            enumerable: true,
            value: function setState(state) {
                return this.invoke('$setState', state);
            }
        },

        // get/setSettings functions
        getSettings: {
            enumerable: true,
            value: function getSettings() {
                return this.invoke('$getSettings');
            }
        },
        setSettings: {
            enumerable: true,
            value: function setSettings(settings) {
                return this.invoke('$setSettings', settings);
            }
        },

        // show alerts
        showAlert: {
            enumerable: true,
            value: function showAlert() {
                return this.invoke('$showAlert');
            }
        },
        showOk: {
            enumerable: true,
            value: function showOk() {
                return this.invoke('$showOk');
            }
        }
    });
}

module.exports = foreground;