const util = require('../common/utils.js');
const {imageToDataURL} = require('../common/boilers.js');

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

function contextWrapper(streamdeck) {

    class Context {
        constructor(action, id) {

            // todo: validate action and uuid

            this.action = action;
            this.id     = id;
        }

        send(data) {
            streamdeck.send({
                event: "sendToPropertyInspector",
                context: this.id,
                action: this.action,
                payload: data
            });
        }

        setTitle(title, target) {
            if (title != null && !util.isString(title)) {
                throw new TypeError('invalid title argument');
            }

            streamdeck.send({
                event:   "setTitle",
                context: this.id,
                payload: {
                    title: title == null ? null : title,
                    target: validateTarget(target)
                }
            });
        }
        setImage(image, target) {

            // TODO: validate image

            streamdeck.send({
                event: "setImage",
                context: this.id,
                payload: {
                    image: image == null ? null : image,
                    target: validateTarget(target)
                }
            });
        }
        setImageFromUrl(url, target) {
            if (!util.isString(url, {notEmpty: true})) {
                throw new TypeError('invalid url');
            }
            target = validateTarget(target);
            let self = this;
            imageToDataURL(url)
                .then(res => self.setImage(res, target), () => {})
                .catch(() => {});
        }
        setState(state) {
            if (!util.isNumber(state, {while: true, min: 0})) {
                throw new TypeError('invalid state argument');
            }

            streamdeck.send({
                event:   "setState",
                context: this.id,
                payload: {state: state}
            });
        }
        setSettings(settings) {
            streamdeck.send({
                event: "setSettings",
                context: this.id,
                payload: settings
            });
        }
        showAlert() {
            streamdeck.send({
                event:   "showAlert",
                context: this.id
            });
        }
        showOk() {
            streamdeck.sendJSON({
                event:   "showAlert",
                context: this.id
            });
        }
    }


    return Context;
}

module.exports = contextWrapper;