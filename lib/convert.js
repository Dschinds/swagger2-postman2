var Collection = require('postman-collection').Collection,
  _ = require('lodash'),
  Helpers = require('./helpers.js'),
  Converter = null,
  fs = require('fs');
  const safeStringify = require('fast-safe-stringify');

Converter = {
  // Static Props:
  collection: null, // will hold the V2 collection object


  // takes in a swagger2 JSON object
  // returns a V2 collection JSON object
  convert: function (input, options, callback) {
    options = _.assign({}, options);

    var parseResult = Helpers.parse(input);

    if (!parseResult.result) {
      return callback(new Error('Invalid input'));
    }
    try {
      return Swagger2OpenAPI.convertObj(parseResult.swagger, {
        fatal: false,
        warnOnly: true
      }, function(err, oas3Wrapper) {
        if (err) {
          return callback(err);
        }

        return OpenAPI2Postman.convert({
          type: 'json',
          data: oas3Wrapper.openapi
        }, options, (error, result) => {
          if (error) {
            return callback('Error importing Swagger 2.0 spec');
          }
          else {
            return callback(null, result);
          }
        });
      });
    }
    catch (e) {
      return callback(e);
    }

    return callback(null, result);
  }
};

// Exports the convert function for the plugin
module.exports = function(input, options, cb) {
  if (input.type === 'string') {
    return Converter.convert(input.data, options, cb);
  }
  else if (input.type === 'json') {
    return Converter.convert(safeStringify(input.data), options, cb);
  }
  else if (input.type === 'file') {
    return fs.readFile(input.data, 'utf8', function(err, data) {
      if (err) {
        return cb(err);
      }

      return Converter.convert(data, options, cb);
    });
  }

  return cb(null, {
    result: false,
    reason: 'input type is not valid'
  });
};
