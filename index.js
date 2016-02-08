var url = require('url');
var _ = require('underscore');

var SolidusAssetsProxy = function(options) {
  if (!(this instanceof SolidusAssetsProxy)) return new SolidusAssetsProxy(options);

  this.origins = options.origins.map(function(origin) {
    // Match URL strings from origin up to the ending delimiter
    var regexp = _.isRegExp(origin) ? origin.source : escapeRegExp(origin);
    return new RegExp('(^|[\'"\\s\\(])(' + regexp + '.*?)($|[\'"\\s\\)])', 'g');
  });
  this.proxy = options.proxy + (options.proxy.slice(-1) == '/' ? '' : '/');
};

SolidusAssetsProxy.prototype.proxyAssets = function(string) {
  if (!string || !string.substring) return string;

  var self = this;

  return self.origins.reduce(function(result, origin) {
    return result.replace(origin, function(match, starting_delimiter, asset, ending_delimiter) {
      return starting_delimiter + self.proxy + encodeURIComponent(asset) + ending_delimiter;
    });
  }, string);
};

SolidusAssetsProxy.prototype.proxyContextAssets = function(context, paths) {
  if (paths) {
    for (var i in paths) {
      proxyObjectAssetsByPath.call(this, context, paths[i].split('.'));
    }
  } else {
    proxyObjectAssets.call(this, context, true);
  }
};

module.exports = SolidusAssetsProxy;

// PRIVATE

function escapeRegExp(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

function proxyObjectAssetsByPath(object, path) {
  if (!object) return;
  if (_.isArray(object)) {
    for (var i in object) proxyObjectAssetsByPath.call(this, object[i], path);
    return;
  }

  var key = path[0];

  if (path.length > 1) {
    proxyObjectAssetsByPath.call(this, object[key], path.slice(1));
  } else {
    object[key] = proxyObjectAssets.call(this, object[key], false);
  }
};

function proxyObjectAssets(object, recursive) {
  var self = this;
  if (_.isArray(object) || (recursive && _.isObject(object))) {
    _.each(object, function(value, key) {
      object[key] = proxyObjectAssets.call(self, value, recursive);
    });
    return object;
  } else {
    return self.proxyAssets(object);
  }
};
