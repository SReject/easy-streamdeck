'use strict';

const hasOwnProperty = Object.prototype.hasOwnProperty;

function isBoolean(subject) {
    return subject === true || subject === false;
}
function isNumber(subject, opts = {}) {

    // not a primitive number
    if (typeof subject !== 'number' || Number(subject) !== subject) {
        return false;
    }

    // nan not allowed
    if (!opts.allowNaN && isNaN(subject)) {
        return false;
    }

    // infinity not allowed
    if (!opts.allowInfinity && !isFinite(subject)) {
        return false;
    }

    // above specified min
    if (opts.min && subject < opts.min) {
        return false;
    }

    // above specified max
    if (opts.max && subject > opts.max) {
        return false;
    }

    // not a whole number
    if (opts.whole && subject % 1 > 0) {
        return false;
    }

    // is valid
    return true;
}
function isString(subject, opts = {}) {

    // not a primitive string
    if (typeof subject !== 'string' || String(subject) !== subject) {
        return false;
    }

    // Empty string not allowed
    if (opts.notEmpty && subject === '') {
        return false;
    }

    // string didn't match specified regex
    if (opts.match && !opts.match.test(subject)) {
        return false;
    }

    return true;
}
function isBase64(subject, options = {}) {

    // Is either not a string or an empty string
    if (!isString(subject, {notEmpty: true})) {
        return false;
    }

    let char62 = options['62'] != null ? options['62'] : '+',
        char63 = options['63'] != null ? options['63'] : '/';

    // validate 62nd and then escape it for the regex pattern
    if (!isString(char62, {notEmpty: true, matches: /^[+._~-]$/i})) {
        throw new TypeError('specified 62nd character invalid');
    }

    // validate 62nd and then escape it for the regex pattern
    if (!isString(char63, {notEmpty: true, matches: /^[^/_,:-]$/i})) {
        throw new TypeError('specified 63rd character invalid');
    }

    // validate 62nd and 63rd pairing
    switch (char62 + char63) {
    case '+/': // RFC 1421, 2045, 3548, 4880, 1642
    case '+,': // RFC 3501
    case '._': // YUI, Program identifier variant 2
    case '.-': // XML name tokens
    case '_:': // RFC 4648
    case '_-': // XML identifiers, Program Identifier variant 1
    case '~-': // Freenet URL-safe
    case '-_': // RFC 4648
        break;
    default:
        throw new TypeError('invalid 62nd and 63rd character pair');
    }

    // escape for regex
    char62 = '\\' + char62;
    char63 = '\\' + char63;

    // create regex
    let match = new RegExp(`^(?:[a-z\\d${char62}${char63}]{4})*(?:[a-z\\d${char62}${char63}]{2}(?:[a-z\\d${char62}${char63}]|=)=)?$`, 'i');

    // test the input
    return match.test(subject);
}

function isArray(subject) {
    return Array.isArray(subject) && subject instanceof Array;
}

function isKey(subject, key) {
    return hasOwnProperty.call(subject, key);
}

const isCallable = (function() {
    let fnToStr = Function.prototype.toString,
        fnClass = '[object Function]',
        toStr = Object.prototype.toString,
        genClass = '[object GeneratorFunction]',
        hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol',
        constructorRegex = /^\s*class\b/;

    function isES6ClassFn(value) {
        try {
            let fnStr = fnToStr.call(value);
            return constructorRegex.test(fnStr);
        } catch (e) {
            return false; // not a function
        }
    }

    function tryFunctionObject(value) {
        try {
            if (isES6ClassFn(value)) {
                return false;
            }
            fnToStr.call(value);
            return true;
        } catch (e) {
            return false;
        }
    }
    return function isCallable(value) {
        if (!value) {
            return false;
        }
        if (typeof value !== 'function' && typeof value !== 'object') {
            return false;
        }
        if (typeof value === 'function' && !value.prototype) {
            return true;
        }
        if (hasToStringTag) {
            return tryFunctionObject(value);
        }
        if (isES6ClassFn(value)) {
            return false;
        }
        let strClass = toStr.call(value);
        return strClass === fnClass || strClass === genClass;
    };
}());

const deepFreeze = (function() {
    function freeze(obj, freezing) {

        // Loop over properties of the input object
        // Done before freezing the initial object
        Object.keys(obj).forEach(key => {

            // ignore properties that have setter/getter descriptors
            let desc = Object.getOwnPropertyDescriptor(obj, key);
            if (!isKey(desc, 'value')) {
                return;
            }

            // get property's value
            let value = obj[key];

            if (
            // value isn't null or undefined
                value != null &&

            // value isn't frozen
            !Object.isFrozen(value) &&

            // value is freezable
            value instanceof Object &&

            // value isn't already in the process of being frozen
            freezing.findIndex(item => item === value) === -1
            ) {

                // store a reference to the value - used to prevent circular reference loops
                freezing.push(value);

                // freeze the property
                obj[key] = freeze(value, freezing);

                // remove the reference
                freezing.pop(value);
            }
        });

        // freeze the base object
        return Object.freeze(obj);
    }
    return function deepFreeze(subject) {
        return freeze(subject, [subject]);
    };
}());

module.exports = Object.freeze({
    isBoolean: isBoolean,
    isNumber: isNumber,
    isString: isString,
    isBase64: isBase64,
    isArray: isArray,
    isKey: isKey,
    isCallable: isCallable,
    deepFreeze: deepFreeze
});