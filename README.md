# easy-streamdeck  
An abstraction layer for Elgato's Stream Deck plugin SDK

# Help
Have questions? ask on Stream Deck's [Community Ran Discord](https://discord.gg/4gYyuxy)

# Usage

### Install
```
npm install --save easy-streamdeck-sdk
```

### Build For Browser
```
npm install -g browserify
npm run build
```

### Use in NodeJs
Simply require the package, then call the `streamdeck.start()` function as detailed in the api.md

### Include in Browser

After building, include the easy-streamdeck.js file as the first resource to be loaded by your plugin

```html
<script src="./path/to/easy-streamdeck.js"></script>
<!-- other scripts that depend on it -->
```

# API
Documentation for the api can be found in **API.md**