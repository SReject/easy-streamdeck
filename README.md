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

### `streamdeck.ready` as Boolean - Read-Only
`true` if streamdeck is ready, otherwise returns `false`

### `streamdeck.port` as Number - Read-Only
The websocket port number to be used when connecting to Stream Deck's software

### `streamdeck.uuid` as String - Read-Only
The current context's UUID

### `streamdeck.layer` as String - Read-Only
The layer of which the current instance is running.  

Will be `plugin` or `propertyinspector`

### `streamdeck.host` as Object - Read-Only
Information related to the host environment

### `streamdeck.host.platform` as String - Read-Only
The platform: `windows` or `mac`

### `streamdeck.host.language` as String - Read-Only
The language Stream Deck's software is using: `en`, `es`, etc

### `streamdeck.host.version` as String - Read-Only
Stream Deck software's version

### `streamdeck.devices` as Array<Device> - Read-Only
List of the currently known connected Stream Deck devices

### `streamdeck.contexts` as Array<Context> - Read-Only - Background Only
List of known buttons related to the plugin



## Methods

### `streamdeck.on(event, handler, once)`  
Adds an event listener to the streamdeck instance

| Argument  |   Type   | Description                                                    |
|-----------|:--------:|----------------------------------------------------------------|
| `event`   |  string  | The event to listen for                                        |
| `handler` | function | The callback to handle the event                               |
| `once`    |  boolean | If true the handler will be removed after the event is emitted |


### `streamdeck.off(event, handler, once)`  
Adds an event listener to the streamdeck instance.

| Argument\* |   Type   | Description                                                    |
|------------|:--------:|----------------------------------------------------------------|
| `event`    |  string  | The event to listen for                                        |
| `handler`  | function | The callback to handle the event                               |
| `once`     |  boolean | If true the handler will be removed after the event is emitted |

\*: Arguments must match those used to create the listener exactly


### `streamdeck.once(event, handler)`  
Alias for `streamdeck.on(event, handler, true)`


### `streamdeck.nonce(event, handler)`  
Alias for `streamdeck.off(event, handler, true)`

### `streamdeck.createContext(action, contextId)` - Background layer only
Creates an untracked context instance.


| Argument\* |  Type  | Description                                      |
|------------|:------:|--------------------------------------------------|
| `action`   | string | The action id of which to create the context for |
| `context`  | string | The context's opaque value                       |


See ContextInstance for more inforation


### `streamdeck.switchToProfile(profileName)` - Background layer only  
Tell streamdeck to switch to a predefined profile

| Argument\*    |  Type  | Description                                                           |
|---------------|:------:|-----------------------------------------------------------------------|
| `profileName` | string | The exact profile name as it is defined in the plugin's manifest.json |


### `streamdeck.openUrl(url)`
Tell streamdeck to open the specified url in the native default browser

| Argument\* |  Type  | Description                |
|------------|:------:|----------------------------|
| `url`      | string | The URL to open            |


# Rest of documentation to-do