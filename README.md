# SolidusAssetsProxy

This [Solidus](https://github.com/solidusjs/solidus) library provides an easy solution for proxying a site's assets with a CDN or a an image processing service like [imgix](https://www.imgix.com/).

This process can be complex since a site will typically use assets from many sources: local server, Amazon S3, URLs from the site's resources, etc. Making sure all URLs in the site's views use the proxy, and setting up the proxy for all these changing sources is time consuming and prone to error.

SolidusAssetsProxy provides two solutions to this:
 - Utility functions to change all assets URLs to proxy URLs in a Solidus context, to be used in a preprocessor. For example, all URLs matching `http://source.com/images/...` would be replaced by `http://proxy.com/mysite/[encoded asset URL]`. No need to setup multiple proxies, a single proxy will take care of all assets sources.
 - A redirects server, that the proxy can use to retrieve the assets data. This server will decode the `[encoded asset URL]` part of the URL above, validate that it matches one of the configurable whitelisted hosts, and redirect to the asset URL. A single redirects server can be used by multiple Solidus sites, and even when developing a new site.

## Installation

```
$ npm install solidus-assets-proxy --save
```

## Library Usage

### Initialization

```javascript
var SolidusAssetsProxy = require('solidus-assets-proxy');
var assets_proxy = new SolidusAssetsProxy({
  origins: [
    'http://resource1.com/images',
    /http:\/\/resource(?:2|3)\.com\/pictures/ // Note the non-capturing group
  ],
  proxy: 'http://proxy.com'
});
```

### `proxyAssets`

Replaces all URLs in a string, matching the `origins` property of the initialization object with the proxy. For example the `http://resource1.com/images/bg/red.jpg` URL will be changed to `http://proxy.com/http%3A%2F%2Fresource1.com%2Fimages%2Fbg%2Fred.jpg`.

Note that:
 - The `origins` property can match only the start of the asset URL.

```javascript
// Preprocessor
module.exports = function(context) {
  context.some.value = assets_proxy.proxyAssets(context.some.value);

  return context;
};
```

### `proxyContextAssets`

Runs `proxyAssets` on all strings in a context, recursively and in place. The second argument is an optional list of paths to limit the changes to.

```javascript
// Preprocessor
module.exports = function(context) {
  // Replace all string values in the context
  assets_proxy.proxyContextAssets(context);

  // Or only a single resource
  assets_proxy.proxyContextAssets(context.resource1);

  // Or only specific paths
  assets_proxy.proxyContextAssets(context, ['resource1.some.value', 'resource2.some.value']);

  return context;
};
```

## Redirects Server Usage

```
# solidus-assets-proxy
```

By default, this will run the server on port 80, and load the redirects whitelist from `solidus-assets-proxy-whitelist[.js or .json]`. The configuration file can look like:

```javascript
module.exports = [
  'http://resource1.com/images', // String: URL must start with this
  /http:\/\/resource(2|3)\.com\/pictures/ // RegExp: URL must `match` this
];
```

The port and configuration file path can be changed with:

```
# PORT=123 solidus-assets-proxy /path/my-list.json
```

If the request URL path is `/` or `/status`, the response will be `200 OK`. For any other URL, the whole path (minus the first `/`) will be decoded, and tested agains the whitelist. If it matches, the response will be a `302` redirect to the decoded URL, else the response will be `406 Not Acceptable`.

## Building

```
$ npm run build
```

## Testing

### Node and automated browser tests

```
$ npm run test
```

### Node test

```
$ npm run node-test
```

### Automated browser test

```
$ npm run browser-test
```

### Manual browser test

```
$ npm run test-server
```
Then access [http://localhost:8081/test/browser/test.html](http://localhost:8081/test/browser/test.html) in your browser
