module.exports = function () {
  'use strict';

  var EOL = '\n';
  var SECTION_NAME_START_SYMBOL = '[';
  var COMMENT_START_SYMBOL = ';';
  var EQUALS_SYMBOL = '=';
  var STRING_TYPE_NAME = 'string';

  function parse(data) {
    if (typeof data !== STRING_TYPE_NAME) {
      throw new TypeError('Data to parse must be string!');
    }

    var result = {};
    var currentIniSection = {};

    data.split(EOL).forEach(function (line) {
      var trimmedLine = line.trim();
      if (trimmedLine) {
        _processLine(trimmedLine, currentIniSection, result);
      }
    });

    // Processing the section left in the buffer
    if (currentIniSection.name) {
      result[currentIniSection.name] = _getDuplicatedObject(currentIniSection.value);
    }

    return result;
  }

  function _processLine(line, currentIniSection, result) {
    if (!line.indexOf(COMMENT_START_SYMBOL)) {
      return; // Skip comments
    }

    if (!line.indexOf(SECTION_NAME_START_SYMBOL)) {
      // Line with new section name
      if (currentIniSection.name) {
        result[currentIniSection.name] = _getDuplicatedObject(currentIniSection.value);
      }

      currentIniSection.name = line.substring(1, line.length - 1);
      currentIniSection.value = {};
    } else {
      // Line with new section property
      var indexOfEquals = line.indexOf(EQUALS_SYMBOL);

      var propertyName = line.substring(0, indexOfEquals).trim();
      currentIniSection.value[propertyName] = line.substring(indexOfEquals + 1).trim();
    }
  }

  function _getDuplicatedObject(obj) {
    var result = {};

    Object.getOwnPropertyNames(obj).forEach(function (propertyName) {
      result[propertyName] = obj[propertyName];
    });

    return result;
  }

  return {
    parse: parse
  };
}();
