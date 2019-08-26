# hermione-headless-chrome

Plugin for [hermione](https://github.com/gemini-testing/hermione) to run integration tests on headless Chrome.

You can read more about hermione plugins [here](https://github.com/gemini-testing/hermione#plugins).

## Installation

```bash
npm install hermione-headless-chrome
```

## Usage

Add plugin to your `hermione` config file:

```js
module.exports = {
    // ...
    plugins: {
        'hermione-headless-chrome': {
            enabled: true
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
