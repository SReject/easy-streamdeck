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

When loaded in a browser-esq enviornment, easy-streamdeck is added to the global scope as `streamdeck` otherwise it is exported


# API




## Properties  
Some properties are only available after `streamdeck.start()` is invoked

#### `streamdeck.ready`
*`Boolean`, `Read-Only`*  

`true` if streamdeck is ready  
`false` if streamdeck is not ready  

<br>  

#### `streamdeck.port` 
*`Number`, `Read-Only`*  

The websocket port number to be used when connecting to Stream Deck's software  

<br>  

#### `streamdeck.uuid`
*`String`, `Read-only`*

The current context's UUID  

<br>  

#### `streamdeck.layer`
*`String`, `Read-Only`*

The layer of which the current instance is running.  

Will be `plugin` or `propertyinspector`  

<br>  

#### `streamdeck.host`
*`Object`, `Read-Only`*

Information related to the host environment  

<br>  

#### `streamdeck.host.platform`
*`String`, `Read-Only`*  

The platform; `windows` or `mac`  

<br>  

#### `streamdeck.host.language`
*`String`, `Read-Only`*

The language Stream Deck's software is using: `en`, `es`, etc  

<br>  

#### `streamdeck.host.version`
*`String`, `Read-Only`*

Stream Deck software's version  

<br>  

#### `streamdeck.devices`
*`Array<Devices>`, `Read-Only`*

List of the currently known connected Stream Deck [device instances](#device)  

<br>  

#### `streamdeck.contexts`
*`Array<Context>`, `Read-Only`, `Background-Only`*

List of known buttons related to the plugin  

<br>  

#### `streamdeck.contextId`
*`String`, `Read-Only`, `PropertyInspector-Only`*

The contextId for the property inspector  

<br>  

#### `streamdeck.actionId`
*`String`, `Read-Only`, `PropertyInspector-Only`*

The actionId for the property inspector



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

| Argument\* |   Type   | Description                                                    |
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

<br>  

#### `streamdeck.openUrl`
Tell streamdeck to open the specified url in the native default browser

| Argument\* |  Type  | Description                |
|------------|:------:|----------------------------|
| `url`      | string | The URL to open            |  

<br>  

#### `streamdeck.send`
Sends the data to Stream Deck's software

| Argument\* |  Type  | Description                |
|------------|:------:|----------------------------|
| `data`     | string | The data to send           |  

<br>  

#### `streamdeck.sendJSON`
Uses `JSON.stringify` and then sends the stringified data to Stream Deck's software

| Argument\* |  Type  | Description                |
|------------|:------:|----------------------------|
| `data`     | *any*  | The data to send           |  

<br>  

#### `streamdeck.switchToProfile`
*`Background-Only`*

Tell streamdeck to switch to a predefined profile

| Argument\*    |  Type  | Description                                                           |
|---------------|:------:|-----------------------------------------------------------------------|
| `profileName` | string | The exact profile name as it is defined in the plugin's manifest.json |  

<br>  

#### `streamdeck.createContext`
*`Background-Only`*

Creates an untracked [context instance](#context)

| Argument\* |  Type  | Description                                      |
|------------|:------:|--------------------------------------------------|
| `action`   | string | The action id of which to create the context for |
| `context`  | string | The context's opaque value                       |


<br><br><br>
## Events
All events are emitted with a single [event instance](#event) argument


#### `ready`
Emitted when easy-streamdeck is ready  

<br>  

#### `websocket:connect`  

<br>  

#### `websocket:message`  

<br>  

#### `websocket:close`  

<br>  

#### `websocket:error`  

<br>  

#### `streamdeck:keypress:up`  

<br>  

#### `streamdeck:keypress:down`  

<br>  

#### `streamdeck:keypress`  

<br>  

#### `streamdeck:application:launch`  

<br>  

#### `streamdeck:application:terminate`  

<br>  

#### `streamdeck:application`  

<br>  

#### `streamdeck:button:appear`  

<br>  

#### `streamdeck:button:titlechange`  

<br>  

#### `streamdeck:button:disappear`  

<br>  

#### `streamdeck:button`  

<br>  

#### `streamdeck:messagerelay`

<br><br><br>
# Structures


## Event  

<br>

## Device  

<br>

## Context