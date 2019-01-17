const util = require('../misc/util.js');

function validateTarget(target) {
    target = target == null ? 0 : target;

    if (String(target) === target) {
        target = target.toLowerCase();
    }

    switch (target) {
    case 0:
    case 'both':
        return 0;

    case 1:
    case 'hardware':
        return 1;

    case 2:
    case 'software':
        return 2;

    default:
        throw new TypeError('invalid target argument');
    }
}

class Context {
    constructor(streamdeck, action, uuid) {
        this.streamdeck = streamdeck;

        // todo: validate action and uuid
        this.action     = action;
        this.uuid       = uuid;
    }

    setTitle(title, target) {
        if (title != null && !util.isString(title)) {
            throw new TypeError('invalid title argument');
        }

        let payload = {target: validateTarget(target)};
        if (title != null) {
            payload.title = title;
        }
        this.streamdeck.sendJSON({
            event: "setTitle",
            context: this.uuid,
            payload: payload
        });
    }

    setImage(image, target) {
        // todo: validate image


        let payload = {target: validateTarget(target)};
        if (image != null) {
            payload.image = image;
        }
        this.streamdeck.sendJSON({
            event: "setImage",
            context: this.uuid,
            payload: payload
        });
    }

    showAlert() {
        this.streamdeck.sendJSON({
            event: "showAlert",
            context: this.uuid
        });
    }

    showOk() {
        this.streamdeck.sendJSON({
            event: "showAlert",
            context: this.uuid
        });
    }

    setState(state) {
        if (!util.isNumber(state, {while: true, min: 0})) {
            throw new TypeError('invalid state argument');
        }

        this.streamdeck.sendJSON({
            event: "setState",
            context: this.uuid,
            payload: {state: state}
        });
    }

    sendToPropertyInspector(data) {
        this.streamdeck.sendJSON({
            event: "showAlert",
            action: this.action,
            context: this.uuid,
            payload: data
        });
    }

    /*
    setSettings() {
        // Need to figure out how this operates before handling it
    }
    */

    toSafe() {

        // TODO: Create an externally-safe clone of the context instance
        return this;
    }
}

module.exports = Context;