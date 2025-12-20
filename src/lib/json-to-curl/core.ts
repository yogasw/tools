import { tools, toolsRegistry } from "$lib/stores/tools";
import { extractKeyPaths, getNestedValue } from "$lib/tools/jsonParserUtils";

export interface Header {
  key: string;
  value: string;
}

export interface ImportConfig {
  url: string;
  method: string;
  headers: string;
  body: string;
}

export interface ImportResult {
  url?: string;
  method?: string;
  headers?: Header[];
  body?: string;
  config: ImportConfig;
  availableKeys: string[];
}

export const DEFAULT_MAPPINGS = toolsRegistry.find(t => t.id === "json-to-curl")?.defaultMappings;

export const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

// --- Validators ---

export function isValidUrl(value: any): boolean {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    // Allow partial paths if they look like paths? User said "url harus url valid" implying full URL.
    // But sometimes it's just a path "/users". 
    // Let's be strict for now as per "valid url", but maybe allow localhost.
    return value.startsWith('http://') || value.startsWith('https://');
  }
}

export function isValidMethod(value: any): boolean {
  return typeof value === 'string' && METHODS.includes(value.toUpperCase());
}

export function isValidHeaders(value: any): boolean {
  if (!value || typeof value !== 'object') return false;
  
  if (Array.isArray(value)) {
     if (value.length === 0) return false;
     // Check if items look like {key: "...", value: "..."} or {name: "...", value: "..."}
     // Just checking the first one is usually enough for a heuristic
     const item = value[0];
     return item && typeof item === 'object' && (('key' in item) || ('name' in item) || Object.keys(item).length === 1);
  }
  
  // If Object, values should be primitives (strings, numbers, booleans)
  // And avoid nested objects (which would likely be body)
  const values = Object.values(value);
  if (values.length === 0) return false; // Empty object is ambiguous
  
  // Heuristic: If any value is an object/array, it's probably not headers (it's body)
  const hasComplexValue = values.some(v => v !== null && typeof v === 'object');
  if (hasComplexValue) return false;

  return true;
}

// --- Template Resolver ---

/**
 * Resolves a configuration string which can be:
 * 1. A direct key path (e.g. "data.url")
 * 2. A template string with variables (e.g. "$base/$path")
 */
export function resolveValue(data: any, configStr: string): any {
  if (!configStr) return undefined;

  // 1. Try direct key match first (if no special chars or straight match)
  const directValue = getNestedValue(data, configStr);
  if (directValue !== undefined) return directValue;

  // 2. Variable interpolation (e.g. "$host/$path" or "Bearer $token")
  if (configStr.includes('$')) {
    // Replace $var or ${var}
    // Note: We use a regex that captures the key name. 
    // We only replace if we find a value for it.
    let hasReplacement = false;
    const resolved = configStr.replace(/\$?\{?([a-zA-Z0-9_.[\]]+)\}?/g, (match, key) => {
      // If we are just matching words that happen to look like keys but no $, skip?
      // The requirement is "$key".
      if (!match.startsWith('$')) return match;
      
      // key is capture group 1. But wait, if match is "$host", capture 1 is "host".
      // If match is "host" (no $), capture 1 is "host".
      // The regex needs to be stricter to only match $...
      // Let's refine the regex logic simply.
      
      return match; // Placeholder, see improved logic below
    });
    
    // Better template logic: only target specific $ patterns
    return configStr.replace(/(\$([a-zA-Z0-9_.[\]]+))|(\$\{([a-zA-Z0-9_.[\]]+)\})/g, (match, p1, p2, p3, p4) => {
        const key = p2 || p4; // p2 for $key, p4 for ${key}
        const val = getNestedValue(data, key);
        if (val !== undefined) {
            hasReplacement = true;
            return String(val);
        }
        return match;
    });
  }

  return undefined;
}


// --- Specific Matchers ---

// --- Generic Matcher Helper ---

function findValidatedMatch(
  data: any, 
  availableKeys: string[], 
  defaultKeywords: string[], 
  validator: (val: any) => boolean
): string {
  // 1. Keyword / Template Matching
  for (const keyword of defaultKeywords) {
      // Logic: 
      // A. If variable syntax ($...), try to resolve as template
      // B. If normal key, try to find in availableKeys (fuzzy match)
      
      let val: any = undefined;
      let candidateKey = "";

      if (keyword.includes('$')) {
         // Template match
         val = resolveValue(data, keyword);
         if (val !== undefined && validator(val)) {
             return keyword; // Return the template itself as the config
         }
      } else {
         // Standard key match
         candidateKey = findBestMatch(availableKeys, [keyword]);
         if (candidateKey) {
             val = getNestedValue(data, candidateKey);
             if (validator(val)) {
                 return candidateKey;
             }
         }
      }
  }

  // 2. Fallback: Value Scan (Look for ANY key that validates)
  for (const key of availableKeys) {
    const val = getNestedValue(data, key);
    if (validator(val)) return key;
  }
  
  return "";
}

// --- Specific Matchers ---

export function findUrlMatch(data: any, availableKeys: string[], defaultKeywords: string[] = []): string {
  return findValidatedMatch(data, availableKeys, defaultKeywords, isValidUrl);
}

export function findMethodMatch(data: any, availableKeys: string[], defaultKeywords: string[] = []): string {
  return findValidatedMatch(data, availableKeys, defaultKeywords, isValidMethod);
}

export function findHeadersMatch(data: any, availableKeys: string[], defaultKeywords: string[] = []): string {
  return findValidatedMatch(data, availableKeys, defaultKeywords, isValidHeaders);
}


export function findBestMatch(availableKeys: string[], keywords: string[]): string {
  const LowerKeys = availableKeys.map(k => k.toLowerCase());
  for (const keyword of keywords) {
    if (availableKeys.includes(keyword)) return keyword;
    const index = LowerKeys.indexOf(keyword.toLowerCase());
    if (index !== -1) return availableKeys[index];
    const suffixMatch = availableKeys.find(k => k.toLowerCase().endsWith(`.${keyword.toLowerCase()}`));
    if (suffixMatch) return suffixMatch;
  }
  return "";
}

// --- Generators ---

export function generateCurlCommand(method: string, url: string, headers: Header[], body: string): string {
  let cmd = `curl -X ${method} "${url || 'http://localhost'}"`;
  
  headers.forEach(h => {
    if (h.key && h.value) {
      cmd += ` \\\n  -H "${h.key}: ${h.value}"`;
    }
  });

  if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
    const escapedBody = body.replace(/'/g, "'\\''");
    cmd += ` \\\n  -d '${escapedBody}'`;
  }

  return cmd;
}

export function generateHttpRequest(method: string, url: string, headers: Header[], body: string): string {
  let path = "/";
  let host = "localhost";
  
  try {
    const urlObj = new URL(url || "http://localhost");
    path = urlObj.pathname + urlObj.search;
    host = urlObj.host;
  } catch (e) {}

  let req = `${method} ${path} HTTP/1.1\n`;
  req += `Host: ${host}\n`;
  
  headers.forEach(h => {
    if (h.key && h.value) {
      req += `${h.key}: ${h.value}\n`;
    }
  });

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    req += `\n${body}`;
  }

  return req;
}

// --- Main Import Function ---

export function importFromJson(
  jsonInput: string, 
  config: ImportConfig, 
  defaultMappings: any = DEFAULT_MAPPINGS
): ImportResult {
  const result: ImportResult = { 
      config: { ...config },
      availableKeys: []
  };

  
  try {
    const data = JSON.parse(jsonInput);
    const availableKeys = extractKeyPaths(data);
    result.availableKeys = availableKeys;

    // 1. Auto-discover mappings if not configured
    if (!result.config.url) result.config.url = findUrlMatch(data, availableKeys, defaultMappings.url);
    if (!result.config.method) result.config.method = findMethodMatch(data, availableKeys, defaultMappings.method);
    if (!result.config.headers) result.config.headers = findHeadersMatch(data, availableKeys, defaultMappings.headers);
    
    // Body is tricky to validate by value, usually explicitly named or fallback to keywords
    if (!result.config.body) result.config.body = findBestMatch(availableKeys, defaultMappings.body);


    // 2. Resolve Values using Config (supports direct keys and templates)
    
    // Import URL
    if (result.config.url) {
      const val = resolveValue(data, result.config.url);
      if (val !== undefined && val !== null) result.url = String(val);
    }

    // Import Method
    if (result.config.method) {
      const val = resolveValue(data, result.config.method);
      if (isValidMethod(val)) {
        result.method = String(val).toUpperCase();
      }
    }

    // Import Body
    if (result.config.body) {
      // For body, we usually want the object itself if it's a key path
      // resolveValue logic tries to return direct value first.
      const val = getNestedValue(data, result.config.body); 
      // If direct value exists, use it. If not, try template?
      // Body is rarely a template string, usually a sub-object.
      
      if (val) {
        result.body = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
      } else {
         // Fallback to template resolution if user really wants "$part1 $part2" as body? 
         const tplVal = resolveValue(data, result.config.body);
         if (tplVal) result.body = String(tplVal);
      }
    }

    // Import Headers
    if (result.config.headers) {
      const val = getNestedValue(data, result.config.headers);
      if (val && typeof val === 'object') {
        if (Array.isArray(val)) {
           result.headers = val.map((h: any) => ({
             key: h.key || h.name || Object.keys(h)[0] || "",
             value: h.value || Object.values(h)[0] || ""
           })).filter(h => h.key);
        } else {
          result.headers = Object.entries(val).map(([k, v]) => ({ key: k, value: String(v) }));
        }
      }
    }


    // 2. Special handling for User-Agent
    const uaKey = findBestMatch(availableKeys, ['user_agent', 'user-agent', 'user-agent-data']);
    if (uaKey) {
       const uaVal = getNestedValue(data, uaKey);
       if (typeof uaVal === 'string') {
          if (!result.headers) result.headers = [];
          const exists = result.headers.some(h => h.key.toLowerCase() === 'user-agent');
          if (!exists) {
             result.headers.push({ key: 'User-Agent', value: uaVal });
          }
       }
    }

    // 3. Body Prettifying
    if (result.body && typeof result.body === 'string') {
        try {
            const trimmed = result.body.trim();
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                 const parsed = JSON.parse(trimmed);
                 result.body = JSON.stringify(parsed, null, 2);
            }
        } catch (e) {
            // Not a JSON string, keep as is
        }
    }

  } catch (e) {
    console.error("Import error", e);
    result.availableKeys = [];
  }

  return result;
}
