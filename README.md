# easy-streamdeck  
An abstraction layer for Elgato's Stream Deck plugin SDK

# Help
Have questions? ask on Stream Deck's [Community Ran Discord](https://discord.gg/4gYyuxy)

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
Documentation for the api can be found in **API.md**