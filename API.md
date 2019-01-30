
# API
When loaded in a browser-esq enviornment, easy-streamdeck is added to the global scope as `streamdeck` otherwise it is exported via `module.exports`

## Common
Members shared by both the plugin/background and PropertyInspector/foreground instances.

### Properties
Properties are read-only

| Property   | Type                           | Description                                                      |
|------------|:------------------------------:|------------------------------------------------------------------|
| `ready`    | boolean                        | `true` if the library is ready, `false` otherwise                |
| `port`     | number                         | The port that will be used to connect to Stream Deck's software  |
| `id`       | string                         | The current context's UUID/opaqueValue                           |
| `layer`    | string                         | The current context's layer: `"plugin"` or `"propertyinspector"` |
| `host`     | [`host`](#host)                | Data related to the host                                         |
| `devices`  | array\<[`device`](#device)\>   | Tracked connected devices                                        |
| `contexts` | array\<[`context`](#context)\> | Tracked buttons related to the plugin                            |

<br><br>

### Methods

#### `streamdeck.on`
Adds an event listener

| Arguments |   Type   | Description                                                    |
|-----------|:--------:|----------------------------------------------------------------|
| `event`   | string   | The event to listen for                                        |
| `handler` | function | The callback to handle the event                               |
| `once`    | boolean  | If true the handler will be removed after the event is emitted | 

<br> 

#### `streamdeck.off`  
Adds an event listener to the streamdeck instance.

| Arguments\* |   Type   | Description                                                    |
|-------------|:--------:|----------------------------------------------------------------|
| `event`     | string   | The event to listen for                                        |
| `handler`   | function | The callback to handle the event                               |
| `once`      | boolean  | If true the handler will be removed after the event is emitted |

\*: Arguments must match those used to create the listener exactly  

<br>  

#### `streamdeck.once`  
Alias for `streamdeck.on(event, handler, true)`

|  Arguments |   Type   | Description                                                    |
|------------|:--------:|----------------------------------------------------------------|
| `event`    | string   | The event to listen for                                        |
| `handler`  | function | The callback to handle the event                               |  

<br>  

#### `streamdeck.nonce`  
Alias for `streamdeck.off(event, handler, true)`

| Arguments\* |   Type   | Description                                                    |
|-------------|:--------:|----------------------------------------------------------------|
| `event`     | string   | The event to listen for                                        |
| `handler`   | function | The callback to handle the event                               |

\*: Arguments must match those used to create the listener exactly  

<br>  

#### `streamdeck.openUrl`
Tell Stream Deck's software to open the specified url in the native default browser

| Arguments  |  Type  | Description                |
|------------|:------:|----------------------------|
| `url`      | string | The URL to open            |  

<br>  

#### `streamdeck.send`
JSON stringify's the data and sends the result to Stream Deck's software

| Arguments  |  Type  | Description                |
|------------|:------:|----------------------------|
| `data`     | *any*  | The data to send           |  

<br>

#### `streamdeck.register`
Registers a callback that an opposing layer can invoke.

If the callback returns a `Promise`, easy-streamdeck will wait for the promise to resolve before responding with the result, otherwise the returned value is assumed to be the result.

| Arguments |  Type    | Description                                    |
|-----------|:--------:|------------------------------------------------|
| `method`  | string   | A unique name identifying the method           |
| `handler` | function | The callback function to handle the invocation |

<br>

#### `streamdeck.unregister`
Unregisters a callback that an opposing layer could invoke.

| Arguments\* |  Type    | Description                                    |
|-------------|:--------:|------------------------------------------------|
| `method`    | string   | A unique name identifying the method           |
| `handler`   | function | The callback function to handle the invocation |

\*: Arguments must exactly match those used when registering

<br><br>

### Events
All events are emitted with a single [Event]() instance argument

#### `websocket:ready`  
Emitted when the underlying websocket connection to the streamdeck software connects  

`this` refers to the streamdeck instance

<br>  

#### `websocket:message`  
Emitted when a message is received from the streamdeck software websocket connection.  
This event is NOT emitted if the message contains a streamdeck event

`this` refers to the streamdeck instance

| `<event.data>` Property |  Type  | Description      |
|-------------------------|:------:|------------------|
|                         | String | The message data |  

<br>  

#### `websocket:close`  
Emitted when the underlying websocket connection to the streamdeck software connects  

`this` refers to the streamdeck instance

| `<event.data>` Property |  Type  | Description                               |
|-------------------------|:------:|-------------------------------------------|
| `code`                  | Number | The close code                            |
| `reason`                | String | A plain text decription of the close code |  

<br>  

#### `websocket:error`  
Emitted when the underlying websocket connection suffers from either a protocol or connection error.  

`this` refers to the streamdeck instance

<br>  

#### `ready`
Emitted when easy-streamdeck is ready  

`this` refers to the streamdeck instance

<br><br><br>

## Plugin/Background
Members specific to the background instance

### `streamdeck.Context`
[Context](#context) class used to create arbitrary context instances.

| Arguments |  Type  | Description                               |
|-----------|:------:|-------------------------------------------|
| `id`      | string | The context id identifying the context    |
| `action`  | string | The action the context is associated with |

<br><br>

### Methods

#### `streamdeck.switchToProfile`
*`Background-Only`*

Tell streamdeck to switch to a predefined profile

| Argument      |  Type  | Description                                                           |
|---------------|:------:|-----------------------------------------------------------------------|
| `profileName` | string | The exact profile name as it is defined in the plugin's manifest.json | 

<br><br>

### Events
All events are emitted with a single [`Event`](#event) instance argument.

#### `application:launch`  
Emitted when a monitored application is launched

`this` refers to the Stream Deck instance

| `<event.data>` Property |  Type  | Description              |
|-------------------------|:------:|--------------------------|
|                         | String | The application launched |  

<br>  

#### `application:terminate`  
Emitted when a monitored application is terminated

`this` refers to the Stream Deck instance

| `<event.data>` Property |  Type  | Description              |
|-------------------------|:------:|--------------------------|
|                         | String | The application launched |  

<br>  

#### `application`
Emitted when a monitored application is launched or terminated  

`this` refers to the Stream Deck instance

| `<event.data>` Property | Type   | Description                    |
|-------------------------|:------:|--------------------------------|
| `event`                 | String | `"launched"` or `"terminated"` |
| `application`           | String | The monitor application        |  

<br>

#### `device:connect`  
Emitted when a streamdeck device is connected

`this` refers to the Stream Deck instance

| `<event.data>` Property | Type                | Description              |
|-------------------------|:-------------------:|--------------------------|
|                         | [`Device`](#device) | The application launched |  

<br>  

#### `device:disconnect`  
Emitted when a streamdeck device is disconnected

`this` refers to the Stream Deck instance

| `<event.data>` Property | Type                | Description              |
|-------------------------|:-------------------:|--------------------------|
|                         | [`Device`](#device) | The application launched |  

<br>  

#### `device`
Emitted when a monitored application is launched or terminated  

`this` refers to the Stream Deck instance

| `<event.data>` Property | Type                | Description                   |
|-------------------------|:-------------------:|-------------------------------|
| `event`                 | String              | `"connect"` or `"disconnect"` |
| `device`                | [`Device`](#device) | The device affected           |  

<br>

#### `keypress:down`  
Emitted when a button is pressed on the Stream Deck hardware  

`this` refers to the [Context](#context) instance that caused the event


<br>  

#### `keypress:up`  
Emitted when a pressed button is released on the Stream Deck hardware  

`this` refers to the [Context](#context) instance that caused the event


<br>  

#### `keypress`  
Emitted when a button is either pressed or released

`this` refers to the [Context](#context) instance

| `<event.data>` Property | Type   | Description                                       |
|-------------------------|:------:|---------------------------------------------------|
| `event`                 | String | The keypress event that took place                |

<br>  

#### `context:appear`
Emitted when a button related to the plugin will appear on the stream deck hardware  

`this` refers to the [Context](#context) instance that caused the event

<br>  

#### `context:titlechange`
Emitted when a context's title parameters have changed 

`this` refers to the [Context](#context) instance

| `<event.data>` Property | Type              | Description                           |
|-------------------------|:-----------------:|---------------------------------------|
|                         | [`Title`](#title) | The title before changes were applied |  

<br>  

#### `context:disappear`
Emitted when a context will not longer be displayed on the stream deck hardware

`this` refers to the [Context](#context) instance

<br>  

#### `context`
Emitted when an event happens on a context

`this` refers to the [Context](#context) instance

| `<event.data>` Property | Type              | Description                                                                   |
|-------------------------|:-----------------:|-------------------------------------------------------------------------------|
| `event`                 | String            | The event name                                                                |
| `previousTitle`         | [`Title`](#title) | The title before changes were applied (only included with titlechange events) |  

<br>

#### `notify:<event>`
Emitted when the foreground sends a notification

`this` refers to the [Context](#context) instance that sent the notification.  
*Bugged: `this` current refers to streamdeck; will be fixed in a near future version*

| `<event.data>` Property | Type  | Description                     |
|-------------------------|:-----:|---------------------------------|
|                         | *any* | Any data accompanying the event |

<br>

#### `notify`
Emitted when the foreground sends a notification

`this` refers to the [Context](#context) instance that sent the notification.  
*Bugged: `this` current refers to streamdeck; will be fixed in a near future version*

| `<event.data>` Property | Type    | Description                     |
|-------------------------|:-------:|---------------------------------|
| `event`                 | string  | The name of the notify event    |
| `data`                  | *any*   | The data accompanying the event |

<br>

#### `message`
Emitted when the foreground sends a message to the background via `sendToPlugin`
This event is suppressed if its handled by the Cross-Layer Communication protocol

`this` refers to the [context](#context) instance that sent the message

| `<event.data>` Property | Type    | Description                     |
|-------------------------|:-------:|---------------------------------|
|                         | *any*   | The data accompanying the event |

<br><br><br>

## PropertyInspector/Foreground
Members specific to the PropertyInspector/Foreground instance

### Properties
Properties are read-only

| Property    | Type   | Description                                     |
|-------------|:------:|-------------------------------------------------|
| `contextId` | string | Context id representing the background instance |
| `actionId`  | string | ActionId of the foreground                      |

<br><br>

### Methods

#### `streamdeck.sendToPlugin`
Uses `JSON.stringify` and then sends the data to the background layer 

| Arguments  |  Type  | Description                |
|------------|:------:|----------------------------|
| `data`     | *any*  | The data to send           |

<br>

#### `streamdeck.invoke`
Invokes a method registered on the background layer.

Returns a `Promise` that is fulfilled when the background layer responds with a result.

| Arguments |  Type  | Description                             |
|-----------|:------:|-----------------------------------------|
| `method`  | string | The registered method to invoke         |
| `...args` | *any*  | Data to pass to the method's invocation |

<br>

#### `streamdeck.notify`
Sends a `notify` event to the background layer

| Arguments |  Type  | Description                       |
|-----------|:------:|-----------------------------------|
| `event`   | string | The name of the notify event      |
| `data`    | *any*  | Data to pass to the event emitter |

<br>

#### `streamdeck.getTitle`
Requests the foreground's title from the background layer.

Returns a `Promise` that is fulfilled when the background layer responds

<br>

#### `streamdeck.setTitle`
Requests the background layer change the foreground's title

Returns a `Promise` that is fulfilled when the background layer responds

| Arguments |  Type          | Description                                                        |
|-----------|:--------------:|--------------------------------------------------------------------|
| `title`   | string         | Text to set the title to. Use an empty string to revert to default |
| `target`  | number\|string | (Optional; default: 0) 0: both, 1: hardware, 2: software           |

<br>

#### `streamdeck.getImage`
Requests the foreground's image from the background layer.

Returns a `Promise` that is fulfilled when the background layer responds.
*Currently, always results in a rejection as getImage is not supported by Stream Deck's SDK*

<br>

#### `streamdeck.setImage`
Requests the background layer change the foreground's image

Returns a `Promise` that is fulfilled when the background layer responds

| Arguments |  Type          | Description                                              |
|-----------|:--------------:|----------------------------------------------------------|
| `image`   | string         | base64 encoded data url to set as the image              |
| `target`  | number\|string | (Optional; default: 0) 0: both, 1: hardware, 2: software |

<br>

#### `streamdeck.setImageFromURL`
Requests the background layer change the foreground's image

Returns a `Promise` that is fulfilled when the background layer responds

| Arguments |  Type          | Description                                              |
|-----------|:--------------:|----------------------------------------------------------|
| `url`     | string         | url of image                                             |
| `target`  | number\|string | (Optional; default: 0) 0: both, 1: hardware, 2: software |

<br>

#### `streamdeck.getState`
Requests the foreground's state from the background layer.

Returns a `Promise` that is fulfilled when the background layer responds.

<br>

#### `streamdeck.setState`
Requests the background layer update the foreground's state

Returns a `Promise` that is fulfilled when the background layer responds

<br>

#### `streamdeck.getSettings`
Requests the foreground's settings from the background layer.

Returns a `Promise` that is fulfilled when the background layer responds.

| Arguments |  Type  | Description                         |
|-----------|:------:|-------------------------------------|
| `state`   | number | The state to set for the foreground |

<br>

#### `streamdeck.setSettings`
Requests the background layer update the foreground's settings.

Returns a `Promise` that is fulfilled when the background layer responds.

| Arguments  |  Type  | Description                                                |
|------------|:------:|------------------------------------------------------------|
| `settings` | *any*  | Settings object to overwrite the currently stored settings |

<br>

#### `streamdeck.showAlert`
Requess the background layer show an alert on the foreground's context.

Returns a `Promise` that is fulfilled when the background layer responds.

<br>

#### `streamdeck.showOk`
Requess the background layer show an Ok alert on the foreground's context.

Returns a `Promise` that is fulfilled when the background layer responds.

<br><br>

### Events

#### `notify:<event>`
Emitted when the foreground sends a notification

`this` refers to the Stream Deck instance 

| `<event.data>` Property | Type  | Description                     |
|-------------------------|:-----:|---------------------------------|
|                         | *any* | Any data accompanying the event |

<br>

#### `notify`
Emitted when the foreground sends a notification

`this` refers to the Stream Deck instance 

| `<event.data>` Property | Type    | Description                     |
|-------------------------|:-------:|---------------------------------|
| `event`                 | string  | The name of the notify event    |
| `data`                  | *any*   | The data accompanying the event |

<br>

#### `message`
Emitted when the background sends a message to the foreground via `sendToPropertyInspector`
This event is suppressed if its handled by the Cross-Layer Communication protocol

`this` refers to the Stream Deck instance

| `<event.data>` Property | Type    | Description                     |
|-------------------------|:-------:|---------------------------------|
|                         | *any*   | The data accompanying the event |

<br><br><br>

# Structures

## Host
Describes streamdeck's host enviornment

| Property\* | Type   | Description                                          |
|------------|:------:|------------------------------------------------------|
| `language` | String | The current language Stream Deck's software is using |
| `platform` | String | The platform; `"windows"` or `"mac"`                 |
| `version`  | String | Stream Deck's software version                       |

\*: Properties are read-only

<br><br>

## Device 
Describes a streamdeck hardware device

| Property\* | Type   | Description                                  |
|------------|:------:|----------------------------------------------|
| `id`       | String | An opaque value used to reference the device |
| `type`     | Number | *unknown*                                    |
| `columns`  | Number | The number of button columns the device has  |
| `rows`     | Number | The number of button rows the device has     |

\*: Properties are read-only

<br><br>

## Title
Describes a context's title

| Property\*  | Type    | Description                                                                         |
|-------------|:-------:|-------------------------------------------------------------------------------------|
| `shown`     | Boolean | Indicates if the title is shown                                                     |
| `text`      | String  | The title text                                                                      |
| `font`      | String  | The font used to display the title text                                             |
| `style`     | String  | *unknown*                                                                           |
| `underline` | Boolean | `true` if the text is to be underlined; `false` otherwise                           |
| `color`     | String  | Color used to display the title as a hex color value                                |
| `alignment` | String  | `top`, `middle`, or `bottom` indicating how the title text is aligned on the button |

\*: Properties are read-only

<br><br>

## Context
Describes a context

### Properties

| Property\*      | Type                | Description
|-----------------|:-------------------:|-------------------------------------------------------------------|
| `action`        | string              | Action id associated with the context                             |
| `id`            | string              | An opaque value identifying the context                           |
| `column`        | number              | The column the button/context resides                             |
| `row`           | number              | The row the button/context resides                                |
| `device`        | [`device`](#deivce) | The device the context is assoicated with                         |
| `title`         | [`title`](#title)   | The context's title                                               |
| `settings`      | object              | Settings stored for the context                                   |
| `state`         | number              | The current state of the button                                   |
| `inMultiAction` | boolean             | `true` the the context is part of a multiaction otherwise `false` |

\*: Properties are read-only

<br><br>

### Methods

#### `<Context>.send`
Uses `JSON.stringify` on the data then sends the data from the plugin layer to the property inspector layer

| Arguments | Type   | Description      |
|-----------|:------:|------------------|
| `data`    | *any*  | The data to send |  

<br>

#### `<Context>.setTitle`
Attempts to set the title text for the context

| Arguments | Type         | Description                                                     |
|-----------|:------------:|-----------------------------------------------------------------|
| `title`   | string\|null | The title text to set; specify null to revert changes           |
| `target`  | Number       | 0(default): Both software and hardare, 1: hardware, 2: software |

<br>

#### `<Context>.setImage`
Attempts to set the context's image

| Arguments | Type   | Description                                                     |
|-----------|:------:|-----------------------------------------------------------------|
| `image`   | string | The image as a base64 data URI to use                           |
| `target`  | number | 0(default): Both software and hardare, 1: hardware, 2: software |

<br>

#### `<Context>.setImageFromUrl`
Attempts to set the context's image

| Arguments | Type   | Description                                                     |
|-----------|:------:|-----------------------------------------------------------------|
| `url`     | string | The image url to load                                           |
| `target`  | number | 0(default): Both software and hardare, 1: hardware, 2: software |

<br>

#### `<Context>.setState`
Sets the context to a predefined state

| Arguments | Type   | Description                                   |
|-----------|:------:|-----------------------------------------------|
| `state`   | number | The 0-based state index to set the context to |

<br>

#### `<Context>.setSettings`
Stores a settings object for the context

| Arguments  | Type   | Description       |
|------------|:------:|-------------------|
| `settings` | object | Settings to store |

<br>

#### `<Context>.showAlert`
Shows the alert icon on the context for a few moments

<br>

#### `<Context>.showOk`
Shows the ok icon on the context for a few moments

<br>

#### `<Context>.invoke`
Invokes a registered method on the context.

Returns a `Promise` that is fulfilled when the context responds

| Arguments | Type   | Description                          |
|-----------|:------:|--------------------------------------|
| `method`  | string | The registered method name           |
| `...args` | *any*  | The arguments to pass to the handler |

<br>

#### `<Context>.notify`
Raises a notify event on the context

| Arguments | Type   | Description                     |
|-----------|:------:|---------------------------------|
| `event`   | string | The name of the event to emit   |
| `data`    | *any*  | The data to accompany the event |

<br><br>

## Event  
Passed as the only argument to event handlers when an event is emitted

#### `<event>.stop()`
If called, no other event handlers will be called for the emitted event instance

#### `<event>.data`
The data accompanying the event; the value varies dependant on the event being emitted  

<br>