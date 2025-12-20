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

export const DEFAULT_MAPPINGS = {
  url: ['url', 'endpoint', 'path', 'uri', 'request.url'],
  method: ['method', 'type', 'verb', 'request.method'],
  headers: ['headers', 'header', 'request_headers', 'request.headers'],
  body: ['body', 'payload', 'data', 'content', 'request_body', 'request.body']
};

export const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];


export function findBestMatch(availableKeys: string[], keywords: string[]): string {
  const LowerKeys = availableKeys.map(k => k.toLowerCase());
  for (const keyword of keywords) {
    // 1. Exact match
    if (availableKeys.includes(keyword)) return keyword;
    
    // 2. Case-insensitive match
    const index = LowerKeys.indexOf(keyword.toLowerCase());
    if (index !== -1) return availableKeys[index];

    // 3. Ends with keyword (e.g. "request.url" matches "url")
    // But prefer shorter matches or exact end matches
    const suffixMatch = availableKeys.find(k => k.toLowerCase().endsWith(`.${keyword.toLowerCase()}`));
    if (suffixMatch) return suffixMatch;
  }
  return "";
}

export function generateCurlCommand(method: string, url: string, headers: Header[], body: string): string {
  let cmd = `curl -X ${method} "${url || 'http://localhost'}"`;
  
  headers.forEach(h => {
    if (h.key && h.value) {
      cmd += ` \\\n  -H "${h.key}: ${h.value}"`;
    }
  });

  if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
    // Escape single quotes for shell safety
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

    // Apply default mappings if config is empty
    if (!result.config.url) result.config.url = findBestMatch(availableKeys, defaultMappings.url);
    if (!result.config.method) result.config.method = findBestMatch(availableKeys, defaultMappings.method);
    if (!result.config.headers) result.config.headers = findBestMatch(availableKeys, defaultMappings.headers);
    if (!result.config.body) result.config.body = findBestMatch(availableKeys, defaultMappings.body);

    // Import URL
    if (result.config.url) {
      const val = getNestedValue(data, result.config.url);
      if (val !== undefined && val !== null) result.url = String(val);
    }

    // Import Method
    if (result.config.method) {
      const val = getNestedValue(data, result.config.method);
      if (val) {
        const m = String(val).toUpperCase();
        if (METHODS.includes(m)) result.method = m;
      }
    }

    // Import Body
    if (result.config.body) {
      const val = getNestedValue(data, result.config.body);
      if (val) {
        result.body = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
      }
    }

    // Import Headers
    if (result.config.headers) {
      const val = getNestedValue(data, result.config.headers);
      if (val && typeof val === 'object') {
        if (Array.isArray(val)) {
           // Handle array of {key, value} or {name, value}
           result.headers = val.map((h: any) => ({
             key: h.key || h.name || Object.keys(h)[0] || "",
             value: h.value || Object.values(h)[0] || ""
           })).filter(h => h.key); // Filter out empty keys
        } else {
          // Handle object { "Content-Type": "application/json" }
          result.headers = Object.entries(val).map(([k, v]) => ({ key: k, value: String(v) }));
        }
      }
    }
  } catch (e) {
    console.error("Import error", e);
    result.availableKeys = [];
  }

  return result;
}
