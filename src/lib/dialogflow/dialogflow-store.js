import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// LocalStorage keys
const STORAGE_KEYS = {
  url: 'dialogflow_url',
  authorization: 'dialogflow_authorization',
  cookie: 'dialogflow_Cookie',
  pageSize: 'dialogflow_pageSize',
  interactionsPageSize: 'dialogflow_interactionsPageSize'
};

// Load from localStorage
function loadFromStorage(key, defaultValue = '') {
  if (!browser) return defaultValue;
  return localStorage.getItem(key) || defaultValue;
}

// Save to localStorage
function saveToStorage(key, value) {
  if (browser) localStorage.setItem(key, value);
}

// Create persistent store
function createPersistentStore(key, defaultValue = '') {
  const store = writable(loadFromStorage(key, defaultValue));
  store.subscribe(value => saveToStorage(key, value));
  return store;
}

// Config stores (persisted)
export const configUrl = createPersistentStore(STORAGE_KEYS.url);
export const configAuthorization = createPersistentStore(STORAGE_KEYS.authorization);
export const configCookie = createPersistentStore(STORAGE_KEYS.cookie);
export const configPageSize = createPersistentStore(STORAGE_KEYS.pageSize, '5000');
export const configInteractionsPageSize = createPersistentStore(STORAGE_KEYS.interactionsPageSize, '50');

// App state stores
export const historyData = writable(null);
export const allIntents = writable([]); // All intents from API
export const isLoading = writable(false);
export const isLoadingIntents = writable(false);
export const error = writable(null);
export const selectedSessionIndex = writable(-1);
export const openTabs = writable([]);
export const activeTabIndex = writable(0);
export const historySearchQuery = writable('');
export const detailSearchQuery = writable('');
export const detailViewMode = writable('chat');
export const intentViewMode = writable('summary'); // 'summary' or 'all'

// Filtered history list
export const filteredHistory = derived(
  [historyData, historySearchQuery],
  ([$historyData, $query]) => {
    if (!$historyData?.sessionConversations) return [];
    
    const conversations = $historyData.sessionConversations;
    if (!$query.trim()) return conversations;
    
    const q = $query.toLowerCase();
    return conversations.filter(conv => {
      const sessionId = conv.conversationResponse?.sessionId?.toLowerCase() || '';
      const queryText = conv.conversationResponse?.queryText?.toLowerCase() || '';
      const intents = conv.interactions?.map(i => 
        i.v2Response?.queryResult?.intent?.displayName?.toLowerCase() || ''
      ).join(' ') || '';
      
      return sessionId.includes(q) || queryText.includes(q) || intents.includes(q);
    });
  }
);

// Current tab data
export const currentTabData = derived(
  [openTabs, activeTabIndex],
  ([$openTabs, $activeTabIndex]) => {
    if ($openTabs.length === 0 || $activeTabIndex >= $openTabs.length) return null;
    return $openTabs[$activeTabIndex];
  }
);

// Tab actions
export function addTab(sessionIndex, sessionData) {
  openTabs.update(tabs => {
    const existing = tabs.findIndex(t => t.index === sessionIndex);
    if (existing !== -1) {
      activeTabIndex.set(existing);
      return tabs;
    }
    
    const newTabs = [...tabs, {
      index: sessionIndex,
      sessionId: sessionData.conversationResponse?.sessionId || `Session ${sessionIndex + 1}`,
      data: sessionData
    }];
    activeTabIndex.set(newTabs.length - 1);
    return newTabs;
  });
}

export function closeTab(tabIndex) {
  openTabs.update(tabs => {
    const newTabs = tabs.filter((_, i) => i !== tabIndex);
    activeTabIndex.update(current => {
      if (newTabs.length === 0) return 0;
      if (current >= newTabs.length) return newTabs.length - 1;
      if (current > tabIndex) return current - 1;
      return current;
    });
    return newTabs;
  });
}

export function selectTab(tabIndex) {
  activeTabIndex.set(tabIndex);
}

export function resetState() {
  historyData.set(null);
  selectedSessionIndex.set(-1);
  openTabs.set([]);
  activeTabIndex.set(0);
  error.set(null);
}
