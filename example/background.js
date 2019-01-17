/*globals streamdeck*/
streamdeck.on('ready', function() {
    console.log('Streamdeck is ready', streamdeck);
});


/* GENERIC EVENTS*/
streamdeck.on('websocket:connect', function () {
    console.log('Connected to streamdeck');
});
streamdeck.on('websocket:message', function (evt) {
    console.log('websocket message:', evt.data);
});
streamdeck.on('websocket:close', function (evt) {
    console.log('websocket closed:', evt.data);
});
streamdeck.on('websocket:error', function (evt) {
    console.log('websocket error:', evt.data);
});


/* BUTTON EVENTS*/
streamdeck.on('streamdeck:button:appear', function (evt) {
    console.log('Button added:', evt.data);
});
streamdeck.on('streamdeck:button:titlechange', function (evt) {
    console.log('Button title change:', evt.data.context, evt.data.previousTitle);
});
streamdeck.on('streamdeck:button:disappear', function (evt) {
    console.log('Button removed:', evt.data);
});