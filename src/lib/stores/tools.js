import { writable } from "svelte/store";

// SEO Configuration untuk Homepage
export const homepageSEO = {
  title: "Free Dev Tools - Base64, JSON Parser & More",
  description:
    "Free online developer tools: Base64 encoder/decoder, JSON parser (Python/Ruby/JS), WhatsApp link generator, date calculator. Fast, open source, ad-free.",
  keywords: [
    "developer tools",
    "free tools",
    "online tools",
    "web tools",
    "dev utilities",
    "programming tools",
    "base64 encoder",
    "json parser",
    "whatsapp link generator",
    "date calculator",
    "developer utilities",
    "web development tools",
  ],
  ogTitle: "Free Developer Tools & Utilities",
  ogDescription:
    "Fast, free, open source, ad-free tools for developers. Base64 encoder, JSON parser, WhatsApp link generator, and more.",
  ogImage: "/og-image.png", // You'll need to create this
  canonical: "https://yogasw.my.id/utilities/",
};

// Tools registry - tambah tools baru di sini dan akan otomatis muncul di navigation
// type: 'internal' untuk halaman di dalam app, 'external' untuk link ke URL lain
export const toolsRegistry = [
  {
    id: "base64",
    name: "Base64 Encoder/Decoder",
    description: "Encode and decode Base64 strings",
    seoTitle: "Free Base64 Encoder/Decoder - Convert Text to Base64 Online",
    seoDescription:
      "Free online Base64 encoder and decoder tool. Convert text to Base64, decode Base64 to text, encode images to Base64 string, decode Base64 data. Perfect for developers, web designers, and anyone working with Base64 encoding and decoding.",
    keywords: [
      "base64 encoder",
      "base64 decoder",
      "base64 converter",
      "encode to base64",
      "decode base64",
      "base64 tool",
      "base64 online",
      "text to base64",
      "base64 to text",
      "base64 image encoder",
      "base64 string converter",
      "free base64 tool",
    ],
    searchTerms: [
      "how to encode base64",
      "how to decode base64",
      "convert string to base64",
      "base64 encoding online",
      "base64 decoding tool",
      "what is base64 encoding",
    ],
    ogTitle: "Free Base64 Encoder/Decoder Tool",
    ogDescription:
      "Convert text to Base64 and decode Base64 strings online. Fast, free, and privacy-friendly.",
    ogImage: "/og-base64.png",
    canonical: "https://yogasw.my.id/utilities/base64",
    icon: "🔐",
    type: "internal",
    category: "encoding",
  },
  {
    id: "wame-link-generator",
    name: "WhatsApp Link Generator (wa.me)",
    description: "Generate wa.me WhatsApp click-to-chat links",
    seoTitle:
      "Free WhatsApp Link Generator (wa.me) - Create Click-to-Chat Links",
    seoDescription:
      "Free WhatsApp link generator tool to create wa.me click-to-chat links instantly. Generate WhatsApp direct message links, WhatsApp chat links with pre-filled messages, WhatsApp business links without saving contacts. Perfect for marketing, customer support, and social media.",
    keywords: [
      "whatsapp link generator",
      "wa.me link generator",
      "whatsapp click to chat",
      "create whatsapp link",
      "whatsapp direct message link",
      "whatsapp chat link",
      "whatsapp business link",
      "whatsapp message link",
      "wame link creator",
      "whatsapp url generator",
      "whatsapp link maker",
      "free whatsapp link tool",
    ],
    searchTerms: [
      "how to create whatsapp link",
      "generate whatsapp chat link",
      "whatsapp link without saving number",
      "create clickable whatsapp link",
      "whatsapp message link generator",
      "how to make wa.me link",
    ],
    ogTitle: "Free WhatsApp Link Generator (wa.me)",
    ogDescription:
      "Create wa.me click-to-chat links instantly for WhatsApp marketing and customer support.",
    ogImage: "/og-whatsapp.png",
    canonical: "https://yogasw.my.id/utilities/wame-link-generator",
    icon: "💬",
    type: "internal",
    category: "generator",
  },
  {
    id: "camera-mic-test",
    name: "Camera & Mic Test",
    description: "Test camera and microphone permissions",
    seoTitle: "Free Camera & Microphone Test - Test Webcam and Mic Online",
    seoDescription:
      "Free online camera and microphone test tool. Check if your webcam works, test microphone audio, verify camera and mic permissions in browser. Perfect for troubleshooting video calls, online meetings, and streaming setup.",
    keywords: [
      "camera test",
      "microphone test",
      "webcam test",
      "mic test online",
      "test camera online",
      "check microphone",
      "webcam checker",
      "audio test",
      "video test",
      "camera permission test",
      "mic permission check",
      "free camera test tool",
    ],
    searchTerms: [
      "how to test camera online",
      "check if microphone works",
      "test webcam before meeting",
      "verify camera permissions",
      "microphone not working test",
      "online camera and mic test",
    ],
    ogTitle: "Free Camera & Microphone Test",
    ogDescription:
      "Test your webcam and microphone online. Check camera and mic permissions for video calls.",
    ogImage: "/og-camera.png",
    canonical: "https://tools.yogasw.my.id/test-permission-camera-and-mic",
    icon: "🎥",
    type: "external",
    url: "https://tools.yogasw.my.id/test-permission-camera-and-mic/",
    category: "media",
  },
  {
    id: "date-time-diff",
    name: "Date Time Difference",
    description: "Calculate the difference between two dates and times",
    seoTitle:
      "Free Date Time Difference Calculator - Calculate Days Between Dates",
    seoDescription:
      "Free date and time difference calculator. Calculate days between dates, find time difference between two dates, compute age calculator, count working days, calculate hours and minutes between times. Perfect for project planning, age calculation, and time tracking.",
    keywords: [
      "date difference calculator",
      "time difference calculator",
      "calculate days between dates",
      "date calculator",
      "time calculator",
      "days between dates",
      "age calculator",
      "date time difference",
      "hours calculator",
      "working days calculator",
      "date duration calculator",
      "free date calculator",
    ],
    searchTerms: [
      "how to calculate date difference",
      "find days between two dates",
      "calculate time difference",
      "how many days between dates",
      "date and time calculator",
      "difference between two dates",
    ],
    ogTitle: "Free Date Time Difference Calculator",
    ogDescription:
      "Calculate days, hours, and minutes between two dates. Free online date and time calculator.",
    ogImage: "/og-datetime.png",
    canonical: "https://yogasw.my.id/utilities/date-time-diff",
    icon: "⏱️",
    type: "internal",
    category: "calculator",
  },
  {
    id: "json-parser",
    name: "JSON Parser",
    description: "Parse JSON from multiple formats and extract specific keys",
    seoTitle: "Free JSON Parser - Parse Python, Ruby, JavaScript JSON Online",
    seoDescription:
      "Free JSON parser and formatter tool supporting multiple programming languages. Parse JSON from JavaScript, Python, Ruby formats. Convert Python dict to JSON, parse Ruby hash to JSON, extract JSON keys, format and validate JSON online. Supports nested JSON parsing and key extraction.",
    keywords: [
      "json parser",
      "json formatter",
      "parse json online",
      "json validator",
      "json viewer",
      "json beautifier",
      "python json parser",
      "ruby json parser",
      "javascript json parser",
      "parse python dict",
      "convert ruby hash to json",
      "json key extractor",
      "nested json parser",
      "json tree viewer",
      "free json tool",
      "json converter",
    ],
    searchTerms: [
      "how to parse json",
      "parse json from python",
      "convert python dict to json",
      "parse ruby hash as json",
      "format json online",
      "validate json structure",
      "extract keys from json",
      "parse nested json",
      "json with None True False",
      "ruby json with nil",
      "python dictionary to json converter",
    ],
    ogTitle: "Free JSON Parser - Python, Ruby, JavaScript Support",
    ogDescription:
      "Parse and format JSON from multiple programming languages. Extract keys, validate, and view JSON structure.",
    ogImage: "/og-json.png",
    canonical: "https://yogasw.my.id/utilities/json-parser",
    icon: "🔍",
    type: "internal",
    category: "parser",
    related_article: "/blog/json-parser-tool/",
    fullScreen: true,
  },
  {
    id: "json-to-curl",
    name: "JSON to Curl",
    description: "Convert JSON Request to Curl and simulate request",
    seoTitle: "Free JSON to Curl Converter - Simulate API Requests Online",
    seoDescription:
      "Free online JSON to Curl converter and API request simulator. Build HTTP requests with headers and body, generate Curl commands, and preview raw HTTP requests. Test APIs directly from your browser.",
    keywords: [
      "json to curl",
      "curl generator",
      "api simulator",
      "http request builder",
      "curl command builder",
      "test api online",
      "api testing tool",
      "rest api client",
      "json body to curl",
    ],
    searchTerms: [
      "how to convert json to curl",
      "generate curl from json",
      "simulate http request online",
      "api request builder free",
      "curl command generator",
    ],
    ogTitle: "Free JSON to Curl Converter & API Simulator",
    ogDescription:
      "Convert JSON requests to Curl commands and simulate API calls online.",
    ogImage: "/og-json-curl.png",
    canonical: "https://yogasw.my.id/utilities/json-to-curl",
    icon: "🚀",
    type: "internal",
    category: "converter",
    related_article: "/blog/json-to-curl-tool/",
    fullScreen: true,
    // Default field mappings for Import feature - user can customize or extend
    defaultMappings: {
      url: ['url', 'endpoint', 'path', 'uri', 'request_url', 'target', 'https://$host$path'],
      method: ['method', 'type', 'http_method', 'request_method'],
      headers: ['headers', 'header', 'request_headers', 'http_headers'],
      body: ['body', 'payload', 'data', 'content', 'request_body']
    }
  },
  {
    id: "beo-echo",
    name: "Beo Echo",
    description: "Beo echo is api mocking tools for testing and development",
    seoTitle: "Beo Echo - Free API Mocking and Testing Tool",
    seoDescription:
      "Free API mocking and testing tool. Beo Echo helps developers create mock API endpoints, test HTTP requests, simulate API responses, and develop without backend dependencies. Perfect for frontend development, API testing, integration testing, and rapid prototyping.",
    keywords: [
      "api mocking tool",
      "api testing",
      "mock api",
      "http echo server",
      "api simulator",
      "rest api testing",
      "api development tool",
      "mock http requests",
      "api endpoint tester",
      "webhook testing",
      "api response simulator",
      "free api mocking",
      "beo echo",
      "echo api",
    ],
    searchTerms: [
      "how to mock api",
      "test api without backend",
      "create mock api endpoint",
      "api testing tool free",
      "simulate api responses",
      "mock rest api",
      "test http requests online",
      "what is api mocking",
      "best api mocking tools",
      "api echo service",
    ],
    ogTitle: "Beo Echo - Free API Mocking Tool",
    ogDescription:
      "Mock API endpoints and test HTTP requests. Free API testing and development tool.",
    ogImage: "https://beo-echo.xyz/favicon.svg",
    canonical: "https://beo-echo.xyz/",
    icon: "https://beo-echo.xyz/favicon.svg",
    type: "external",
    url: "https://beo-echo.xyz/",
    category: "testing",
  },
  {
    id: "dialogflow-tools",
    name: "Dialogflow Tools",
    description: "Search, view, and analyze Dialogflow conversations and intents",
    seoTitle:
      "Dialogflow Tools - Search, View, and Analyze Dialogflow Conversations and Intents",
    seoDescription:
      "Free Dialogflow conversation history viewer. Search sessions, view chat logs, analyze intent history, debug webhook errors. Perfect for Dialogflow developers and support teams.",
    keywords: [
      "dialogflow history",
      "dialogflow conversation viewer",
      "dialogflow chat logs",
      "dialogflow intent history",
      "dialogflow debugging tool",
      "dialogflow session viewer",
      "dialogflow webhook debugger",
      "google dialogflow tools",
      "dialogflow analytics",
      "chatbot history viewer",
    ],
    searchTerms: [
      "view dialogflow conversations",
      "dialogflow session history",
      "debug dialogflow intents",
      "dialogflow webhook errors",
      "analyze chatbot conversations",
    ],
    ogTitle: "Dialogflow History Tool - Conversation Viewer",
    ogDescription:
      "View and search Dialogflow conversation history, chat logs, and intent analytics.",
    ogImage: "/og-dialogflow.png",
    canonical: "https://yogasw.my.id/utilities/dialogflow-history",
    icon: "💬",
    type: "internal",
    category: "debugging",
    fullScreen: true, // Uses full-height app layout instead of contained layout
  },
];

function createToolsStore() {
  const { subscribe, set, update } = writable(toolsRegistry);

  return {
    subscribe,
    // Method untuk tambah tool external
    addExternalTool: (tool) =>
      update((tools) => [...tools, { ...tool, type: "external" }]),
    // Method untuk get tool by id
    getById: (id) => {
      let tool;
      subscribe((tools) => {
        tool = tools.find((t) => t.id === id);
      })();
      return tool;
    },
  };
}

export const tools = createToolsStore();
