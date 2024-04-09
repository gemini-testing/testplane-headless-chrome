# hermione-headless-chrome

Plugin for [hermione](https://github.com/gemini-testing/hermione) to run integration tests on downloaded headless Chromium.

NB: plugin searches builds starting from last stable version, but downloaded developers version. Builds for some versions may not be found. Detail information on [article](https://www.chromium.org/getting-involved/download-chromium).

You can read more about hermione plugins [here](https://github.com/gemini-testing/hermione#plugins).

## Installation

```bash
npm install hermione-headless-chrome
```

## Usage

* **enabled** (optional) `Boolean` – enable/disable the plugin; by default plugin is enabled.
* **browserId** (required) `String` - browser id on hermione config for headless Chromium.
* **version** (optional) `Boolean` - Chromium version; latest stable version by default.
* **cachePath** (optional) `String` - path to directory for downloaded Chromium binary; */hermione-headless-chrome* on *home directory* by default.
* **downloadAttempts** (optional) `Number` - attempts count for download Chromium; `30` by default.

Also there is ability to override plugin parameters by CLI options or environment variables
(see [configparser](https://github.com/gemini-testing/configparser)).
Use `hermione_headless_chrome_` prefix for the environment variables and `--headless-chrome-` for the cli options.

For example you can override browserId option like so:
```bash
$ hermione_headless_chrome_browser_id=some-browser-id hermione
$ hermione --headless-chrome-browser-id some-browser-id

Add plugin to your `hermione` config file:

```js
module.exports = {
    // ...
    browsers: {
        'example-browser-id': {
            desiredCapabilities: {
                browserName: 'chrome',
                browserVersion: '123.0'
            }
        }
    },
    // ...
    plugins: {
        'hermione-headless-chrome': {
            enabled: true,
            browserId: 'example-browser-id',
            version: '123'
        }
    },
    //...
}
```

## Testing

Run [mocha](http://mochajs.org) tests:
```bash
npm run test-unit
```

Run [eslint](http://eslint.org) codestyle verification
```bash
npm run lint
```
