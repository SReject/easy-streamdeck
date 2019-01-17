const util = require('../misc/util.js');
const Context = require('./context.js');

module.exports = function (streamdeck, $devices, $contexts) {

    return function onmessage(evt) {
        let msg = evt.data;

        // Streamdeck doesn't send empty messages
        if (msg == null) {
            return;
        }

        // Streamdeck always sends JSON objects
        //   msg doesn't appear to be a json object string
        if (!util.isString(msg, {match: /^\{[\s\S]+\}$/})) {
            console.log('[onmessage] message doesn\'t appear to be JSON');
            return;
        }
        try {
            msg = JSON.parse(msg);

        // parse failed, return indicating not a streamdeck message
        } catch (e) {
            console.log('[onmessage] message failed to parse');
            return;
        }

        // Streamdeck messages always have an event property that is a non-empty string
        if (!util.isString(msg.event, {notEmpty: true})) {
            console.log('[onmessage] message doesn\'t have an event property');
            return;
        }


        // PropertyInspector Layer Events
        if (streamdeck.layer === 'propertyinspector') {

            // Temporary - Instead, process as RPC message
            if (msg.event === 'sendToPropertyInspector') {
                streamdeck.emit('streamdeck:messagerelay', {message: msg.payload});

            // Unknown evnt
            } else {
                console.log('[onmessage#propertyinspector] unknow property-inspector layer event:', msg.event);
                return;
            }

        // Event: applicationDidLaunch
        // Event: applicationDidTerminate
        } else if (msg.event === 'applicationDidLaunch' || msg.event === 'applicationDidTerminate') {

            // validate payload
            if (msg.payload == null || !util.isString(msg.payload.application, {notEmpty: true})) {
                console.log('[onmessage#plugin] Bad applicationDidLaunch/terminate event', msg);
                return;
            }

            // Emit events
            let appEvent = msg.event === 'applicationDidLaunch' ? 'launch' : 'terminate';
            streamdeck.emit(`streamdeck:application:${appEvent}`, msg.payload.application);
            streamdeck.emit(`streamdeck:application`, {event: appEvent, application: msg.payload.application});


        // Event: deviceDidConnect
        // Event: deviceDidDisconnect
        } else if (msg.event === 'deviceDidConnect' || msg.event === 'deviceDidDisconnect') {

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
                console.log('[onmessage#plugin] Bad deviceDidConnect/disconnect event', msg);
                return;
            }

            // Build device info object
            let devInfo = {
                    id: msg.device,
                    type: msg.deviceInfo.type,
                    columns: msg.deviceInfo.size.rows,
                    rows: msg.deviceInfo.size.rows
                },
                devEvent = msg.event === 'deviceDidConnect' ? 'connect' : 'disconnect';

            // device connected: store the info in streamdeck's device list
            if (devEvent === 'connect') {
                $devices[devInfo.id] = Object.assign(Object.create(null), devInfo);

            // device diconnected: remove the device from streamdeck's device list
            } else if ($devices[devInfo.id] != null) {
                delete $devices[devInfo.id];
            }

            // Emit events
            streamdeck.emit(`streamdeck:device:${devEvent}`, devInfo);
            streamdeck.emit('streamdeck:device', {event: devEvent, device: devInfo});

        // msg.context should be a hex string
        } else if (!util.isString(msg.context, {match: /^[A-F\d]{32}$/})) {
            console.log('[onmessage#plugin] Bad context property:', msg);
            return;

        // msg.action should be a reversed dns formatted string
        } else if (!util.isString(msg.action, {match: /^[^\\/;%@:]+$/})) {
            console.log('[onmessage#plugin] Bad action property:', msg);
            return;

        // msg.pay should be non-null
        } else if (msg.payload == null) {
            console.log('[onmessage#plugin] Missing payload:', msg);
            return;

        } else {

            // Retrieve any stored information about the device
            let device;
            if ($devices[msg.device] != null) {
                device = Object.assign(Object.create(null), $devices[msg.device]);
            } else {
                device = {id: msg.device};
            }

            // Retrieve and update context
            let evtContext;
            if ($contexts[msg.context] != null) {
                evtContext = $contexts[msg.context];
            } else {
                evtContext = new Context(streamdeck, msg.action, msg.context);
            }
            evtContext.action = msg.action;


            // Event: sendToPlugin
            // Temporary - Instead, process as RPC message
            if (msg.event === 'sendToPlugin') {
                streamdeck.emit('streamdeck:messagerelay', {
                    context: evtContext.toSafe(),
                    message: msg.payload
                });

            // msg.payload.settings should be an object
            } else if (msg.payload.settings == null) {
                console.log('[onmessage#plugin] Missing payload.settings:', msg);
                return;

            // if specified, msg.payload.state should be an unsigned integer
            } else if (msg.payload.state != null && !util.isNumber(msg.payload.state, {whole: true, min: 0})) {
                console.log('[onmessage#plugin] invalid payload.state:', msg);
                return;

            // if specified, msg.payload.isInMultiAction should be a boolean value
            } else if (msg.payload.isInMultiAction != null && !util.isBoolean(msg.payload.isInMultiAction)) {
                console.log('[onmessage#plugin] Missing payload.isInMultiAction:', msg);
                return;

            // msg.payload.coordinates should be an object
            } else if (msg.payload.coordinates == null) {
                console.log('[onmessage#plugin] Missing payload.coordinates:', msg);
                return;

            // msg.payload.coordinates.column should be an unsigned integer
            } else if (!util.isNumber(msg.payload.coordinates.column, {whole: true, min: 0})) {
                console.log('[onmessage#plugin] invalid payload.coordinates.column:', msg);
                return;

            // msg.payload.coordinates.column should be an unsigned integer
            } else if (!util.isNumber(msg.payload.coordinates.row, {whole: true, min: 0})) {
                console.log('[onmessage#plugin] invalid payload.coordinates.row', msg);
                return;

            // Checks passed!
            } else {

                // Update context state
                evtContext.settings = msg.payload.settings;
                evtContext.column   = msg.payload.coordinates.column;
                evtContext.row      = msg.payload.coordinates.row;
                evtContext.device   = device;
                if (msg.payload.isInMultiAction != null) {
                    evtContext.inMultiAction = msg.payload.isInMultiAction;
                }
                if (msg.payload.state != null) {
                    evtContext.state = msg.payload.state;
                }

                // Event: keyUp
                // Event: keyDown
                if (msg.event === 'keyUp' || msg.event === 'keyDown') {

                    // emit events
                    let keyEvent = msg.event === 'keyUp' ? 'up' : 'down';
                    streamdeck.emit(`streamdeck:key:${keyEvent}`, {context: evtContext.toSafe(), device: Object.assign(Object.create(null), device)});
                    streamdeck.emit(`streamdeck:key`, {event: keyEvent, context: evtContext.toSafe(), device: Object.assign(Object.create(null), device)});

                // Event: willAppear
                // Event: willDisappear
                } else if (msg.event === 'willAppear' || msg.event === 'willDisappear') {
                    let disEvent = msg.event === 'willAppear' ? 'appear' : 'disappear';

                    // if appearing, add the context to the tracked contexts list
                    if (disEvent === 'appear') {
                        $contexts[evtContext.uuid] = evtContext;

                    // otherwise remove it from the tracked contexts list
                    } else if ($contexts[evtContext.uuid] != null) {
                        delete $contexts[evtContext.uuid];
                    }

                    // emit events
                    streamdeck.emit(`streamdeck:button:${disEvent}`, evtContext.toSafe());
                    streamdeck.emit('streamdeck:button', {event: disEvent, context: evtContext.toSafe()});

                // Event: titleParametersDidChange
                } else if (msg.event === 'titleParametersDidChange') {

                    let params = msg.payload.titleParameters;
                    if (
                        !util.isString(msg.payload.title) ||
                        params == null ||
                        !util.isString(params.fontFamily) ||
                        !util.isNumber(params.fontSize, {whole: true, min: 6}) ||
                        !util.isString(params.fontStyle) ||
                        !util.isBoolean(params.fontUnderline) ||
                        !util.isBoolean(params.showTitle) ||
                        !util.isString(params.titleAlignment, {match: /^(?:top|middle|bottom)$/}) ||
                        !util.isString(params.titleColor, {match: /^#(?:[a-f\d]{1,8})$/})
                    ) {
                        console.log('[onmessage#plugin] invalid title payload', msg.title, params);
                        return;
                    }

                    let previousTitle = evtContext.title;
                    evtContext.title = {
                        text:      msg.payload.title,
                        font:      params.fontFamily,
                        style:     params.fontStyle,
                        underline: params.fontUnderline,
                        shown:     params.showTitle,
                        alignment: params.titleAlignment,
                        color:     params.titleColor
                    };
                    streamdeck.emit('streamdeck:button:titlechange', {
                        context: evtContext.toSafe(),
                        previousTitle: previousTitle
                    });
                    streamdeck.emit('streamdeck:button', {
                        event: 'titlechange',
                        context: evtContext.toSafe(),
                        previousTitle: previousTitle
                    });

                    // unknown event
                } else {
                    console.log('[onmessage] unknown event', msg);
                    return;
                }
            }
        }
        evt.stop();
    };
};