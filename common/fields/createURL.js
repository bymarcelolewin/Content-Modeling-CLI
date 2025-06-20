//======================================
// file: createURL.js
// version: 2.1
// last updated: 06-02-2025
//======================================

const resolveEmoji = require("@resolve-emoji");

/**
 * Returns a CMA-compatible Symbol field for URL or path validation.
 *
 * @param {Object} options
 * @param {string} options.fieldName - Display name
 * @param {string} options.fieldId - Field ID
 * @param {boolean} options.required - Whether the field is required
 * @param {"url"|"path"|"both"} options.validate - Validation type
 * @param {string} options.emoji - Optional emoji key or literal
 * @returns {Object} CMA-compatible field definition
 */
function createURL({
  fieldName = "URL or Path",
  fieldId = "urlOrPath",
  required = true,
  validate = "both",
  emoji = "",
} = {}) {
  const resolvedEmoji = resolveEmoji(emoji);
  const name = resolvedEmoji ? `${resolvedEmoji} ${fieldName}` : fieldName;

  let pattern;

  switch (validate) {
    case "url":
      pattern = "^https?:\\/\\/[^\\s]+$";
      break;
    case "path":
      pattern = "^\\/[a-zA-Z0-9\\-_/]*$";
      break;
    case "both":
    default:
      pattern = "^(https?:\\/\\/[^\\s]+|\\/[a-zA-Z0-9\\-_/]*)$";
      break;
  }

  return {
    id: fieldId,
    name,
    type: "Symbol",
    required,
    localized: false,
    disabled: false,
    omitted: false,
    validations: [
      {
        regexp: {
          pattern,
          flags: null,
        },
      },
    ],
  };
}

module.exports = {
  createURL,
};