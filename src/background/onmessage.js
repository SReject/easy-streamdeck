const util = require('../common/utils.js');
// const Context = require('./context.js');

// Wrapper function
function onMessageWrapper(deviceList, contextList) {

    let streamdeck = this;

    // Returns the function that will handle the onmessage event
    return function onmessage(evt) {

        // Retrieve message data
        let msg = evt.data;

        // Message null or doesn't appear to be a JSON object string
        if (msg == null || !util.isString(msg, {match: /^\{[\s\S]+\}$/})) {
            return this.emit('websocket:message', evt.data);
        }

        // Attempt to parse the msg
        try {
            msg = JSON.parse(msg);
        } catch (ignore) {
            return this.emit('websocket:message', evt.data);
        }

        let eventName,
            info;

        // Do basic validation of event-specific msg data
        switch (msg.event) {

        case 'applicationDidLaunch':
        case 'applicationDidTerminate':

            // Application related messages will always have a payload.application property that is a non-empty string
            if (msg.payload == null || !util.isString(msg.payload.application, {notEmpty: true})) {
                return this.emit('websocket:message', evt.data);
            }

            // Emit events
            eventName = msg.event === 'applicationDidLaunch' ? 'launch' : 'terminate';
            this.emit(`application:${eventName}`, msg.payload.application);
            this.emit(`application`, {event: eventName, application: msg.payload.application});
            return;


        case 'deviceDidConnect':
        case 'deviceDidDisconnect':

            // Validate device data
            if (
                !util.isString(msg.device, {notEmpty: true}) ||
                msg.deviceInfo.size == null ||
                msg.deviceInfo.size.columns == null ||
                msg.deviceInfo.size.rows == null ||
                !util.isNumber(msg.deviceInfo.type, {whole: true, min: 0}) ||
                !util.isNumber(msg.deviceInfo.size.columns, {whole: true, min: 0}) ||
                !util.isNumber(msg.deviceInfo.size.rows, {whole: true, min: 0})
            ) {
                return this.emit('websocket:message', evt.data);
            }

            // Build device details object
            info = {
                id:      msg.device,
                type:    msg.deviceInfo.type,
                columns: msg.deviceInfo.size.rows,
                rows:    msg.deviceInfo.size.rows
            };

            // Device connected: store a copy of the details in stream deck's device list
            if (msg.event === 'deviceDidConnect') {
                deviceList[info.id] = Object.assign({}, info);
                eventName = 'connect';

                // Device disconnected: remove it from stream deck's device list
            } else {
                delete deviceList[info.id];
                eventName = 'disconnect';
            }

            // Emit events
            this.emit(`device:${eventName}`, info);
            this.emit('device', {event: eventName, device: info});
            return;


        case 'keyUp':
        case 'keyDown':
        case 'willAppear':
        case 'willDisappear':
        case 'titleParametersDidChange':
        case 'sendToPlugin':

            // Valid the event's .context .action and .payload properties
            if (
                !util.isString(msg.context, {match: /^[A-F\d]{32}$/}) ||
                !util.isString(msg.action, {match: /^[^\\/;%@:]+$/}) ||
                msg.payload == null
            ) {
                return this.emit('websocket:message', evt.data);
            }
            break;


        default:
            return this.emit('websocket:message', evt.data);
        }

        // Build device info
        let device;
        if (deviceList[msg.device] != null) {
            device = Object.assign({}, deviceList[msg.device]);

        } else {
            device = {id: msg.device};
        }

        // Deduce Context instance
        let context;
        if (contextList[msg.context] != null) {
            context = contextList[msg.context];

        } else {
            context = new streamdeck.Context(msg.action, msg.context);
        }
        context.action = msg.action;

        // Event: sendToPlugin
        if (msg.event === 'sendToPlugin') {
            return this.emit('message', msg.payload, {self: context});
        }

        // Ease accessing the title parameters for validation
        let params = msg.payload.titleParameters;

        // Validate msg.payload
        if (
            msg.payload.settings == null ||
            msg.payload.coordinates == null ||
            !util.isNumber(msg.payload.coordinates.row, {whole: true, min: 0}) ||
            !util.isNumber(msg.payload.coordinates.column, {whole: true, min: 0}) ||
            (msg.payload.state != null && !util.isNumber(msg.payload.state, {whole: true, min: 0})) ||
            (msg.payload.isInMultiAction != null && !util.isBoolean(msg.payload.isInMultiAction)) ||
            (
                // validate payload.titleParameters for title change event
                msg.event === 'titleParametersDidChange' &&
                (
                    !util.isString(msg.payload.title) ||
                    params == null ||
                    !util.isString(params.fontFamily) ||
                    !util.isNumber(params.fontSize, {whole: true, min: 6}) ||
                    !util.isString(params.fontStyle) ||
                    !util.isBoolean(params.fontUnderline) ||
                    !util.isBoolean(params.showTitle) ||
                    !util.isString(params.titleAlignment, {match: /^(?:top|middle|bottom)$/}) ||
                    !util.isString(params.titleColor, {match: /^#(?:[a-f\d]{1,8})$/})
                )
            )
        ) {
            return this.emit('websocket:message', evt.data);
        }

        // update context info
        context.row = msg.payload.coordinates.row;
        context.column = msg.payload.coordinates.column;
        context.device = device;
        context.settings = msg.payload.settings;
        if (msg.payload.isInMultiAction != null) {
            context.isInMultiAction = msg.payload.isInMultiAction;
        }
        if (msg.payload.state != null) {
            context.state = msg.payload.state;
        }

        switch (msg.event) {
        case 'keyUp':
        case 'keyDown':
            eventName = msg.event === 'keyUp' ? 'up' : 'down';
            this.emit(`keypress:${eventName}`, device, {self: context});
            this.emit('keypress', {event: eventName, device: device}, {self: context});
            return;

        case 'willAppear':
        case 'willDisappear':
            if (msg.event === 'willAppear') {
                contextList[context.id] = context;
                eventName = 'appear';

            } else {
                delete contextList[context.id];
                eventName = 'disappear';
            }

            this.emit(`context:${eventName}`, null, {self: context});
            this.emit(`context`, {event: eventName}, {self: context});
            return;

        case 'titleParametersDidChange':

            // store previous title, and update context with new title info
            info = context.title;
            context.title = {
                text:      msg.payload.title,
                font:      params.fontFamily,
                style:     params.fontStyle,
                underline: params.fontUnderline,
                shown:     params.showTitle,
                alignment: params.titleAlignment,
                color:     params.titleColor
            };

            // emit events
            this.emit('context:titlechange', info, {self: context});
            this.emit('context', {event: 'titlechange', previousTitle: info}, {self: context});
            return;
        }
    };
}

module.exports = onMessageWrapper;