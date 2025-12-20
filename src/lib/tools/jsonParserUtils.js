/**
 * JSON Parser Utilities
 * Reusable functions for parsing and processing JSON data
 */

/**
 * Parse JSON string with support for Ruby, Python formats
 * @param {string} jsonString - The JSON string to parse
 * @returns {any} Parsed JSON object
 */
export function parseJsonString(jsonString) {
  // For Ruby format
  let oldString = jsonString;
  try {
    jsonString = jsonString.replace(/=>/g, ":");
    jsonString = jsonString.replace(/nil/g, "null");
    return JSON.parse(jsonString);
  } catch (e) {
    // Restore original string if Ruby parsing fails
    jsonString = oldString;
  }

  // Fixing the JSON string which might contain escape characters
  let fixedJsonString = jsonString.replace(/\\"/g, '\\"');

  // Replacing single quotes with double quotes
  fixedJsonString = fixedJsonString.replace(/'/g, '"');

  // For Python format
  fixedJsonString = fixedJsonString.replace(/None/g, "null");
  fixedJsonString = fixedJsonString.replace(/True/g, "true");
  fixedJsonString = fixedJsonString.replace(/False/g, "false");

  return JSON.parse(fixedJsonString);
}

/**
 * Process JSON data with key path navigation
 * @param {string} input - Raw JSON input string
 * @param {string[]} listArrayKey - Array of keys to navigate
 * @returns {string} Processed JSON string
 */
export  function processData(input, listArrayKey) {
    let parsedInput = null;
    try {
      parsedInput = JSON.parse(input);
    } catch (e) {
      parsedInput = parseJsonString(input);
    }

    if (!listArrayKey || listArrayKey.length === 0 || listArrayKey[0] === "") {
      return JSON.stringify(parsedInput, null, 2);
    } else {
      let current = parsedInput;

      for (let i = 0; i < listArrayKey.length; i++) {
        let key = listArrayKey[i].trim();

        // Handle array[0] or object.key or [0] format
        if (key.includes("[") && key.includes("]")) {
          // Split by array notation: e.g., "buttons[0]" or "[0]"
          const match = key.match(/^(.+?)?\[(\d+)\]$/);
          if (match) {
            const objKey = match[1]; // could be undefined for "[0]"
            const index = parseInt(match[2]);

            // First access object key if exists
            if (
              objKey &&
              current &&
              typeof current === "object" &&
              !Array.isArray(current)
            ) {
              current = current[objKey];
            }

            // Then access array index
            if (Array.isArray(current) && current[index] !== undefined) {
              current = current[index];
            } else {
              current = undefined;
              break;
            }
          }
        } else {
          // Regular object key access
          if (
            current &&
            typeof current === "object" &&
            !Array.isArray(current) &&
            current.hasOwnProperty(key)
          ) {
            current = current[key];
          } else {
            current = undefined;
            break;
          }
        }

        //handle stringified JSON at each step
        if (typeof current === "string") {
          let oldCurrent = current;
          try {
            current = JSON.parse(current);
          } catch (e) {
            current = oldCurrent;
          }
        }
      }

      // Handle result
      let result;
      if (current === undefined) {
        result = parsedInput;
      }

      result = current;
      if (typeof result === "string") {
        return result;
      }

      return JSON.stringify(current, null, 2);
    }
  }

/**
 * Get preview of a value (first 20 chars)
 * @param {any} value - Value to preview
 * @returns {string} Preview string
 */
export function getValuePreview(value) {
  let preview = "";

  if (value === null) {
    preview = "null";
  } else if (value === undefined) {
    preview = "undefined";
  } else if (typeof value === "string") {
    preview = value;
  } else if (typeof value === "number" || typeof value === "boolean") {
    preview = String(value);
  } else if (Array.isArray(value)) {
    preview = `[${value.length} items]`;
  } else if (typeof value === "object") {
    preview = `{${Object.keys(value).length} keys}`;
  } else {
    preview = String(value);
  }

  if (preview.length > 20) {
    preview = preview.substring(0, 20) + "...";
  }

  return preview;
}

/**
 * Extract all keys from JSON object with previews
 * @param {any} obj - JSON object to extract keys from
 * @param {string} prefix - Current path prefix
 * @returns {Array<{key: string, preview: string}>} Array of key objects
 */
export function extractKeys(obj, prefix = "") {
  let keys = [];

  if (obj && typeof obj === "object") {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const indexKey = `${prefix}[${index}]`;
        keys.push({
          key: indexKey,
          preview: getValuePreview(item),
        });
        if (item && typeof item === "object") {
          const nestedKeys = extractKeys(item, indexKey);
          keys = [...keys, ...nestedKeys];
        }
      });
    } else {
      Object.keys(obj).forEach((key) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.push({
          key: fullKey,
          preview: getValuePreview(obj[key]),
        });
        if (obj[key] && typeof obj[key] === "object") {
          const nestedKeys = extractKeys(obj[key], fullKey);
          keys = [...keys, ...nestedKeys];
        } else if (typeof obj[key] === "string") {
          // Try to parse stringified JSON
          try {
            const parsedString = JSON.parse(obj[key]);
            const nestedKeys = extractKeys(parsedString, fullKey);
            keys = [...keys, ...nestedKeys];
          } catch (e) {
            // Not valid JSON, ignore
          }
        }
      });
    }
  }

  return keys;
}

/**
 * Extract simple key paths from JSON object
 * @param {any} obj - JSON object to extract keys from
 * @param {string} prefix - Current path prefix
 * @returns {string[]} Array of key paths
 */
export function extractKeyPaths(obj, prefix = "") {
  let keys = [];
  if (obj && typeof obj === "object") {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const key = prefix ? `${prefix}[${index}]` : `[${index}]`;
        keys.push(key);
        if (typeof item === "object")
          keys = keys.concat(extractKeyPaths(item, key));
      });
    } else {
      Object.keys(obj).forEach((key) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.push(fullKey);
        if (typeof obj[key] === "object")
          keys = keys.concat(extractKeyPaths(obj[key], fullKey));
      });
    }
  }
  return keys;
}

/**
 * Get nested value from object by path
 * @param {any} obj - Object to navigate
 * @param {string} path - Dot-separated path (e.g., "data.items[0].name")
 * @returns {any} Value at path or undefined
 */
export function getNestedValue(obj, path) {
  if (!path || !obj) return undefined;

  const keys = path
    .split(".")
    .flatMap((k) => {
      // Handle array notation like "items[0]"
      const match = k.match(/^(.+?)\[(\d+)\]$/);
      if (match) return [match[1], parseInt(match[2])];
      // Handle standalone array notation like "[0]"
      const standaloneMatch = k.match(/^\[(\d+)\]$/);
      if (standaloneMatch) return [parseInt(standaloneMatch[1])];
      return [k];
    })
    .filter((k) => k !== "");

  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
}

/**
 * Parse JSON input and return result with keys
 * @param {string} inputText - Raw JSON input
 * @param {string} keysToParse - Dot-separated keys to parse
 * @returns {{output: string, parsed: any, keys: Array, error: string|null}}
 */
export function parseJson(inputText, keysToParse = "") {
  if (!inputText || !inputText.trim()) {
    return { output: "", parsed: null, keys: [], error: null };
  }

  try {
    let listKey = keysToParse
      ? keysToParse
          .split(".")
          .map((k) => k.trim())
          .filter((k) => k)
      : [];

    let result = processData(inputText, listKey);
    let parsed = null;
    let keys = [];

    try {
      parsed = JSON.parse(result);
      keys = extractKeys(parsed);
    } catch (e) {
      parsed = result;
    }

    // Also extract keys from input for autocomplete
    try {
      const inputParsed = JSON.parse(inputText);
      keys = extractKeys(inputParsed);
    } catch (e) {
      try {
        const inputParsed = parseJsonString(inputText);
        keys = extractKeys(inputParsed);
      } catch (e2) {
        // Ignore
      }
    }

    return { output: result, parsed, keys, error: null };
  } catch (e) {
    return {
      output: "",
      parsed: null,
      keys: [],
      error: `Parse error: ${e.message}`,
    };
  }
}
