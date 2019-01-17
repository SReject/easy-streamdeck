# easy-streamdeck  
An abstraction layer for Elgato's Stream Deck plugin SDK

# Usage

### Install  
*to come*

### Build  

```
npm install -g browserify
browserify index.js > easy-streamdeck.js
```

### Include

After building, include the easy-streamdeck.js file as the first resource to be loaded by your plugin

```html
<script src="./path/to/easy-streamdeck.js"></script>
<!-- other scripts that depend on it -->
```

# API
When loaded in a browser-esq enviornment, easy-streamdeck is added to the global scope as `streamdeck` otherwise it is exported via `module.exports`


| Property\*      | Type                           | Description                                                      |
|-----------------|:------------------------------:|------------------------------------------------------------------|
| `ready`         | Boolean                        | `true` if the library is ready, `false` otherwise                |
| `port`          | Number                         | The port that will be used to connect to Stream Deck's software  |
| `uuid`          | String                         | The current context's UUID/opaqueValue                           |
| `layer`         | String                         | The current context's layer: `"plugin"` or `"propertyinspector"` |
| `host`          | [`Host`](#host)                | Data related to the host                                         |
| `devices`       | Array\<[`Device`](#device)\>   | Tracked connected devices                                        |
| `contexts`      | Array\<[`Context`](#context)\> | Tracked buttons related to the plugin                            |
| `contextId`     | String                         | The context's id (propertyinspector layer only)                  |
| `actionId`      | String                         | The context's actionId (propertyinspector layer only)            |

\*: Properties are read-only

<br><br><br>
## Methods

#### `streamdeck.on`  
Adds an event listener to the streamdeck instance

| Argument  |   Type   | Description                                                    |
|-----------|:--------:|----------------------------------------------------------------|
| `event`   |  string  | The event to listen for                                        |
| `handler` | function | The callback to handle the event                               |
| `once`    |  boolean | If true the handler will be removed after the event is emitted |  

<br>  

#### `streamdeck.off`  
Adds an event listener to the streamdeck instance.

| Argument\* |   Type   | Description                                                    |
|------------|:--------:|----------------------------------------------------------------|
| `event`    |  string  | The event to listen for                                        |
| `handler`  | function | The callback to handle the event                               |
| `once`     |  boolean | If true the handler will be removed after the event is emitted |

\*: Arguments must match those used to create the listener exactly  

<br>  

##### `streamdeck.once`  
Alias for `streamdeck.on(event, handler, true)`

|  Argument  |   Type   | Description                                                    |
|------------|:--------:|----------------------------------------------------------------|
| `event`    |  string  | The event to listen for                                        |
| `handler`  | function | The callback to handle the event                               |  

<br>  

#### `streamdeck.nonce`  
Alias for `streamdeck.off(event, handler, true)`

| Argument\* |   Type   | Description                                                    |
|------------|:--------:|----------------------------------------------------------------|
| `event`    |  string  | The event to listen for                                        |
| `handler`  | function | The callback to handle the event                               |

\*: Arguments must match those used to create the listener exactly  

<br>  

#### `streamdeck.openUrl`
Tell streamdeck to open the specified url in the native default browser

| Argument   |  Type  | Description                |
|------------|:------:|----------------------------|
| `url`      | string | The URL to open            |  

<br>  

#### `streamdeck.send`
Sends the data to Stream Deck's software

| Argument   |  Type  | Description                |
|------------|:------:|----------------------------|
| `data`     | string | The data to send           |  

<br>  

#### `streamdeck.sendJSON`
Uses `JSON.stringify` and then sends the stringified data to Stream Deck's software

| Argument   |  Type  | Description                |
|------------|:------:|----------------------------|
| `data`     | *any*  | The data to send           |  

<br>  

#### `streamdeck.switchToProfile`
*`Background-Only`*

Tell streamdeck to switch to a predefined profile

| Argument      |  Type  | Description                                                           |
|---------------|:------:|-----------------------------------------------------------------------|
| `profileName` | string | The exact profile name as it is defined in the plugin's manifest.json |  

<br>  

#### `streamdeck.createContext`
*`Background-Only`*

Creates an untracked [`Context` instance](#context)

| Argument  |  Type  | Description                                      |
|-----------|:------:|--------------------------------------------------|
| `action`  | string | The action id of which to create the context for |
| `context` | string | The context's opaque value                       |


<br><br><br>
## Events
All events are emitted with a single [`Event` instance](#event) argument against the root easy-streamdeck instance. That is, within event handlers, `this` refers to the streamdeck instance.


#### `ready`
Emitted when easy-streamdeck is ready  

<br>  

#### `websocket:connect`  
Emitted when the underlying websocket connection to the streamdeck software connects  

| `<event.data>` Property | Type | Description |
|-------------------------|:----:|-------------|
| *none*                  |      |             |  

<br>  

#### `websocket:message`  
Emitted when a message is received from the streamdeck software websocket connection.  
Note that this event is NOT emitted if the message contains a streamdeck event    

| `<event.data>` Property |  Type  | Description      |
|-------------------------|:------:|------------------|
|                         | String | The message data |  

<br>  

#### `websocket:close`  
Emitted when the underlying websocket connection to the streamdeck software connects  

| `<event.data>` Property |  Type  | Description                               |
|-------------------------|:------:|-------------------------------------------|
| `code`                  | Number | The close code                            |
| `reason`                | String | A plain text decription of the close code |  

<br>  

#### `websocket:error`  
Emitted when the underlying websocket connection suffers from either a protocol or connection error.  

| `<event.data>` Property | Type | Description                                         |
|-------------------------|:----:|-----------------------------------------------------|
| *none*                  |      | No information is provided as to what error occured |  

<br>  

#### `streamdeck:application:launch`  
Emitted when a monitored application is launched

| `<event.data>` Property |  Type  | Description              |
|-------------------------|:------:|--------------------------|
|                         | String | The application launched |  

<br>  

#### `streamdeck:application:terminate`  
Emitted when a monitored application is terminated

| `<event.data>` Property |  Type  | Description              |
|-------------------------|:------:|--------------------------|
|                         | String | The application launched |  

<br>  

#### `streamdeck:application`
Emitted when a monitored application is launched or terminated  

| `<event.data>` Property | Type   | Description                    |
|-------------------------|:------:|--------------------------------|
| `event`                 | String | `"launched"` or `"terminated"` |
| `application`           | String | The monitor application        |  

<br>

#### `streamdeck:device:connect`  
Emitted when a streamdeck device is connected

| `<event.data>` Property | Type                | Description              |
|-------------------------|:-------------------:|--------------------------|
|                         | [`Device`](#device) | The application launched |  

<br>  

#### `streamdeck:device:disconnect`  
Emitted when a streamdeck device is disconnected

| `<event.data>` Property | Type                | Description              |
|-------------------------|:-------------------:|--------------------------|
|                         | [`Device`](#device) | The application launched |  

<br>  

#### `streamdeck:device`
Emitted when a monitored application is launched or terminated  

| `<event.data>` Property | Type                | Description                   |
|-------------------------|:-------------------:|-------------------------------|
| `event`                 | String              | `"connect"` or `"disconnect"` |
| `device`                | [`Device`](#device) | The device affected           |  

<br>

#### `streamdeck:keypress:down`  
Emitted when a button is pressed on the Stream Deck hardware  

| `<event.data>` Property | Type                  | Description                                       |
|-------------------------|:---------------------:|---------------------------------------------------|
| `context`               | [`Context`](#context) | The context instance that the event took place on |
| `device`                | [`Device`](#device)   | The streamdeck device the event took place on     |  

<br>  

#### `streamdeck:keypress:up`  
Emitted when a pressed button is released on the Stream Deck hardware  

| `<event.data>` Property | Type                  | Description                                       |
|-------------------------|:---------------------:|---------------------------------------------------|
| `context`               | [`Context`](#context) | The context instance that the event took place on |
| `device`                | [`Device`](#device)   | The streamdeck device the event took place on     |  

<br>  

#### `streamdeck:keypress`  
Emitted when a pressed button is released on the Stream Deck hardware  

| `<event.data>` Property | Type                  | Description                                       |
|-------------------------|:---------------------:|---------------------------------------------------|
| `event`                 | String                | The keypress event that took place                |
| `context`               | [`Context`](#context) | The context instance that the event took place on |
| `device`                | [`Device`](#device)   | The streamdeck device the event took place on     |  

<br>  

#### `streamdeck:button:appear`
Emitted when a button related to the plugin will appear on the stream deck hardware  

| `<event.data>` Property | Type                  | Description                         |
|-------------------------|:---------------------:|-------------------------------------|
|                         | [`Context`](#context) | The context instance for the button |

<br>  

#### `streamdeck:button:titlechange`
Emitted when a button's title parameters have changed 

| `<event.data>` Property | Type                  | Description                           |
|-------------------------|:---------------------:|---------------------------------------|
| `context`               | [`Context`](#context) | The context instance for the button   |
| `previousTitle`         | [`Title`](#title)     | The title before changes were applied |  

<br>  

#### `streamdeck:button:disappear`
Emitted when a button will not longer be displayed on the stream deck hardware

| `<event.data>` Property | Type                  | Description                         |
|-------------------------|:---------------------:|-------------------------------------|
|                         | [`Context`](#context) | The context instance for the button |

<br>  

#### `streamdeck:button`
Emitted when an event happens on a button

| `<event.data>` Property | Type                  | Description                                                                   |
|-------------------------|:---------------------:|-------------------------------------------------------------------------------|
| `event`                 | String                | The event name                                                                |
| `context`               | [`Context`](#context) | The context instance for the button                                           |
| `previousTitle`         | [`Title`](#title)     | The title before changes were applied (only included with titlechange events) |  

<br>  

#### `streamdeck:messagerelay`
Emitted when a message was sent from one layer to another

| `<event.data>` Property | Type                  | Description                                                                                                                   |
|-------------------------|:---------------------:|-------------------------------------------------------------------------------------------------------------------------------|
| `message`               | String                | The message sent                                                                                                              |
| `context`               | [`Context`](#context) | The context of the message sender (only included if the message was sent by a PropertyInspector instance to the plugin layer) |


<br><br><br>
# Structures


## Event  
Passed as the only argument to event handlers when an event is emitted

#### `<event>.stop()`
If called, no other event handlers will be called for the emitted event instance

#### `<event>.data`
The data accompanying the event; the value varies dependant on the event being emitted  

<br><br><br>
## Host
Describes streamdeck's host enviornment

| Property\* | Type   | Description                                          |
|------------|:------:|------------------------------------------------------|
| `language` | String | The current language Stream Deck's software is using |
| `platform` | String | The platform; `"windows"` or `"mac"`                 |
| `version`  | String | Stream Deck's software version                       |

\*: Properties are read-only

<br>

## Device 
Describes a streamdeck hardware device

| Property\* | Type   | Description                                  |
|------------|:------:|----------------------------------------------|
| `id`       | String | An opaque value used to reference the device |
| `type`     | Number | *unknown*                                    |
| `columns`  | Number | The number of button columns the device has  |
| `rows`     | Number | The number of button rows the device has     |

\*: Properties are read-only

<br>

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

<br>

## Context
Describes a context

| Property\*      | Type                | Description
|-----------------|:-------------------:|-------------------------------------------------------------------|
| `action`        | String              | Action id associated with the context                             |
| `uuid`          | String              | An opaque value identifying the context                           |
| `column`        | Number              | The column the button/context resides                             |
| `row`           | Number              | The row the button/context resides                                |
| `device`        | [`Device`](#deivce) | The device the context is assoicated with                         |
| `title`         | [`Title`](#title)   | The context's title                                               |
| `settings`      | Object              | Settings stored for the context\*                                 |
| `state`         | Number              | The current state of the button                                   |
| `inMultiAction` | Boolean             | `true` the the context is part of a multiaction otherwise `false` |

\*: Properties are read-only

<br>

#### `<Context>.setTitle`
Attempts to set the title text for the context

| Arguments | Type         | Description                                                     |
|-----------|:------------:|-----------------------------------------------------------------|
| `title`   | String\|Null | The title text to set; specify null to revert changes           |
| `target`  | Number       | 0(default): Both software and hardare, 1: hardware, 2: software |

<br>

#### `<Context>.setImage`
Attempts to set the context's image

| Arguments | Type   | Description                                                     |
|-----------|:------:|-----------------------------------------------------------------|
| `image`   | String | The image as a base64 data URI to use                           |
| `target`  | Number | 0(default): Both software and hardare, 1: hardware, 2: software |

<br>

#### `<Context>.showAlert`
Shows the alert icon on the context for a few moments

| Arguments | Type | Description |
|-----------|:----:|-------------|
| *none*    |      |             |

<br>

#### `<Context>.showOk`
Shows the ok icon on the context for a few moments

| Arguments | Type | Description |
|-----------|:----:|-------------|
| *none*    |      |             |

<br>

#### `<Context>.setState`
Sets the context to a predefined state

| Arguments | Type   | Description                                   |
|-----------|:------:|-----------------------------------------------|
| `state`   | Number | The 0-based state index to set the context to |

<br>

#### `<Context>.sendToPlugin`
Sends a message to the plugin layer

| Arguments | Type   | Description      |
|-----------|:------:|------------------|
| `message` | *any*  | The data to send |