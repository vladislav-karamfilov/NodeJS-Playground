module.exports = function () {
  'use strict';

  var EOL = '\n';
  var SECTION_NAME_START_SYMBOL = '[';
  var SECTION_NAME_END_SYMBOL = ']';
  var EQUALS_SYMBOL = '=';
  var OBJECT_TYPE_NAME = 'object';

  function parse(jsonObject) {
    if (typeof jsonObject !== OBJECT_TYPE_NAME) {
      throw new TypeError('Object to parse must be a JSON!')
    }

    var result = '';

    Object.getOwnPropertyNames(jsonObject).forEach(function (propertyName) {
      result += (SECTION_NAME_START_SYMBOL + propertyName + SECTION_NAME_END_SYMBOL + EOL);
      result += (_parseIniSection(jsonObject[propertyName]) + EOL);
    });

    return result.trim();
  }

  function _parseIniSection(obj) {
    var result = '';

    Object.getOwnPropertyNames(obj).forEach(function (propertyName) {
      result += (propertyName + EQUALS_SYMBOL + obj[propertyName] + EOL);
    });

    return result;
  }

  return {
    parse: parse
  }
}();