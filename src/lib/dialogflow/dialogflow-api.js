import { get } from 'svelte/store';
import {
  configUrl,
  configAuthorization,
  configCookie,
  historyData,
  allIntents,
  isLoading,
  isLoadingIntents,
  error,
  resetState
} from './dialogflow-store.js';

/**
 * Parse config URL to extract base path, project name, and key
 * Example URL: https://dialogflow.clients6.google.com/v2beta1/projects/ariokiasisten/locations/global/agent/environments/draft/sessions/-:listConversations?...&key=xyz
 */
export function parseConfigUrl(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extract project name from path: /v2beta1/projects/{PROJECT}/locations/...
    const projectMatch = pathname.match(/\/projects\/([^\/]+)\//);
    const projectName = projectMatch ? projectMatch[1] : null;
    
    // Extract key from query params
    const key = urlObj.searchParams.get('key');
    
    // Build base URL (origin + up to /agent/)
    const agentPathMatch = pathname.match(/(.*\/agent)\//);
    const basePath = agentPathMatch ? agentPathMatch[1] : pathname.split('/agent/')[0] + '/agent';
    const baseUrl = urlObj.origin + basePath;
    
    return {
      origin: urlObj.origin,
      projectName,
      key,
      baseUrl,
      fullUrl: url
    };
  } catch (e) {
    console.error('Error parsing URL:', e);
    return null;
  }
}

/**
 * Build intents URL from parsed config
 */
export function buildIntentsUrl(parsedUrl) {
  if (!parsedUrl?.baseUrl) return null;
  
  const params = new URLSearchParams();
  params.append('pageSize', '1000');
  if (parsedUrl.key) {
    params.append('key', parsedUrl.key);
  }
  
  return `${parsedUrl.baseUrl}/intents?${params.toString()}`;
}

/**
 * Build headers for the Dialogflow API request
 */
function buildHeaders() {
  const authorization = get(configAuthorization);
  const cookie = get(configCookie);
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (authorization) {
    headers['Authorization'] = authorization;
  }
  
  if (cookie) {
    headers['Cookie'] = cookie;
  }
  
  return headers;
}

/**
 * Transform raw API response to add computed fields
 */
function transformData(rawData) {
  if (!rawData?.sessionConversations) {
    return rawData;
  }
  
  rawData.sessionConversations.forEach((conv, index, arr) => {
    try {
      arr[index].webhook_error_status = '';
      arr[index].total_interactions = conv.interactions?.length || 0;
      arr[index].no = index + 1;
      
      // Check for webhook errors
      conv.interactions?.forEach(({ v2Response }) => {
        const status = v2Response?.webhookStatus?.message;
        if (status && status !== 'Webhook execution successful') {
          arr[index].webhook_error_status = status;
        }
      });
      
      // Parse conversation response JSON
      if (conv.interactions?.[0]?.conversationResponseJson) {
        arr[index].conversationResponse = JSON.parse(conv.interactions[0].conversationResponseJson);
      }
    } catch (e) {
      console.warn('Error transforming conversation:', e);
    }
  });
  
  return rawData;
}

/**
 * Fetch history from Dialogflow API
 */
export async function fetchHistory(preserveState = false) {
  const url = get(configUrl);
  
  if (!url) {
    error.set('URL is required');
    return null;
  }
  
  isLoading.set(true);
  error.set(null);
  
  if (!preserveState) {
    resetState();
  }
  
  try {
    const headers = buildHeaders();
    
    // Fetch history and intents in parallel
    const [historyResponse] = await Promise.all([
      fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include'
      }),
      // Fetch intents in background (don't await result)
      fetchAllIntents().catch(err => console.warn('Failed to fetch intents:', err))
    ]);
    
    if (!historyResponse.ok) {
      throw new Error(`HTTP ${historyResponse.status}: ${historyResponse.statusText}`);
    }
    
    const rawData = await historyResponse.json();
    const transformedData = transformData(rawData);
    
    historyData.set(transformedData);
    
    return transformedData;
  } catch (err) {
    console.error('Fetch error:', err);
    error.set(err.message || 'Failed to fetch history');
    return null;
  } finally {
    isLoading.set(false);
  }
}

/**
 * Fetch all intents from Dialogflow API
 */
export async function fetchAllIntents() {
  const url = get(configUrl);
  const parsedUrl = parseConfigUrl(url);
  
  if (!parsedUrl) {
    console.error('Could not parse config URL');
    return null;
  }
  
  const intentsUrl = buildIntentsUrl(parsedUrl);
  if (!intentsUrl) {
    console.error('Could not build intents URL');
    return null;
  }
  
  isLoadingIntents.set(true);
  
  try {
    const headers = buildHeaders();
    
    const response = await fetch(intentsUrl, {
      method: 'GET',
      headers,
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const intents = data.intents || [];
    
    // Transform intents to include parent info
    const transformedIntents = intents.map(intent => ({
      name: intent.name,
      displayName: intent.displayName,
      parentDisplayName: intent.parentFollowupIntentName 
        ? intents.find(i => i.name === intent.parentFollowupIntentName)?.displayName || null
        : null,
      isFallback: intent.isFallback || false,
      inputContexts: intent.inputContextNames || [],
      outputContexts: intent.outputContexts?.map(c => c.name) || [],
      events: intent.events || [],
      trainingPhrases: intent.trainingPhrases?.length || 0,
      priority: intent.priority || 0,
      rootFollowupIntentName: intent.rootFollowupIntentName || null,
      parentFollowupIntentName: intent.parentFollowupIntentName || null,
      messages: intent.messages || []
    }));
    
    allIntents.set(transformedIntents);
    return transformedIntents;
  } catch (err) {
    console.error('Fetch intents error:', err);
    return null;
  } finally {
    isLoadingIntents.set(false);
  }
}

/**
 * Build hierarchical tree from intents using parent references
 * Unit tested - see intentTree.test.js
 * 
 * @param {Array} allIntentsList - List of all intents from API
 * @param {Object} sessionData - Session data with interactions
 * @param {boolean} summaryOnly - If true, only show intents in conversation path
 * @returns {Object} Tree structure with roots array
 */
export function buildIntentTree(allIntentsList, sessionData, summaryOnly = false) {
  // Step 1: Build interactions map from session data
  // Key: intent ID (last part of name), Value: { count, history, first }
  const interactions = new Map();
  let firstFound = false;
  
  sessionData?.interactions?.forEach((interaction, n) => {
    const v2Response = interaction.v2Response;
    const intentName = v2Response?.queryResult?.intent?.name;
    if (!intentName) return;
    
    const intentId = intentName.split('/').pop();
    
    if (interactions.has(intentId)) {
      const existing = interactions.get(intentId);
      existing.count += 1;
      existing.history = `${existing.history},${n + 1}`;
    } else {
      const entry = {
        count: 1,
        history: `${n + 1}`,
        first: false
      };
      if (!firstFound) {
        firstFound = true;
        entry.first = true;
      }
      interactions.set(intentId, entry);
    }
  });
  
  // Step 2: Create intent lookup map (by ID)
  const listIntent = new Map();
  allIntentsList.forEach(intent => {
    const intentId = intent.name?.split('/').pop();
    if (intentId) {
      listIntent.set(intentId, intent);
    }
  });
  
  // Step 3: Build all nodes first
  const nodeMap = new Map();
  
  allIntentsList.forEach(intent => {
    const intentId = intent.name?.split('/').pop();
    const parentId = intent.parentFollowupIntentName?.split('/').pop() || null;
    
    const interaction = interactions.get(intentId);
    const active = !!interaction;
    
    const node = {
      id: intentId,
      displayName: intent.displayName,
      isFallback: intent.isFallback || false,
      parentId: parentId,
      active: active,
      count: interaction?.count || 0,
      history: interaction?.history || '',
      first: interaction?.first || false,
      messages: intent.messages || [],
      children: []
    };
    
    nodeMap.set(intentId, node);
  });
  
  // Step 4: Build parent-child relationships
  const roots = [];
  
  nodeMap.forEach(node => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      const parent = nodeMap.get(node.parentId);
      parent.children.push(node);
    } else {
      // No parent or parent not found - this is a root
      roots.push(node);
    }
  });
  
  // Step 5: Sort - alphabetically by displayName within same level
  function sortNodes(nodes) {
    nodes.sort((a, b) => a.displayName.localeCompare(b.displayName));
    nodes.forEach(node => {
      if (node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  }
  
  sortNodes(roots);
  
  // Step 6: Filter for summaryOnly mode if needed
  if (summaryOnly) {
    function hasActiveDescendant(node) {
      if (node.active) return true;
      return node.children.some(hasActiveDescendant);
    }
    
    function filterTree(nodes) {
      return nodes.filter(node => {
        if (node.active || hasActiveDescendant(node)) {
          node.children = filterTree(node.children);
          return true;
        }
        return false;
      });
    }
    
    const filteredRoots = filterTree(roots);
    return { 
      roots: filteredRoots, 
      nodeMap, 
      interactions,
      totalNodes: Array.from(nodeMap.values()).length,
      activeNodes: Array.from(nodeMap.values()).filter(n => n.active).length
    };
  }
  
  return { 
    roots, 
    nodeMap, 
    interactions,
    totalNodes: Array.from(nodeMap.values()).length,
    activeNodes: Array.from(nodeMap.values()).filter(n => n.active).length
  };
}


/**
 * Extract chat interactions from a session (combined user+bot per interaction)
 */
export function extractChatMessages(sessionData) {
  if (!sessionData?.interactions) return [];
  
  return sessionData.interactions.map((interaction, idx) => {
    const v2Response = interaction.v2Response;
    const queryResult = v2Response?.queryResult;
    const intent = queryResult?.intent;
    
    // Get bot response text
    let botText = queryResult?.fulfillmentText || '';
    if (!botText && queryResult?.fulfillmentMessages?.length) {
      botText = queryResult.fulfillmentMessages[0]?.text?.text?.[0] || '';
    }
    
    // Get output contexts
    const outputContexts = queryResult?.outputContexts?.map(ctx => {
      const name = ctx.name?.split('/').pop() || '';
      return name;
    }).filter(Boolean) || [];
    
    // Get input contexts  
    const inputContexts = interaction.inputContexts?.map(ctx => {
      const name = ctx.name?.split('/').pop() || '';
      return name;
    }).filter(Boolean) || [];
    
    return {
      order: idx + 1,
      userText: queryResult?.queryText || '',
      botText: botText,
      intentName: intent?.displayName || 'Unknown Intent',
      timestamp: interaction.createTime || sessionData.startTime,
      confidence: queryResult?.intentDetectionConfidence || 0,
      webhookStatus: v2Response?.webhookStatus?.message || null,
      inputContexts,
      outputContexts,
      isFallback: intent?.isFallback || false,
      rawData: interaction // Full raw interaction data
    };
  });
}

/**
 * Extract intent history from a session
 */
export function extractIntentHistory(sessionData) {
  if (!sessionData?.interactions) return [];
  
  return sessionData.interactions.map((interaction, idx) => {
    const v2Response = interaction.v2Response;
    const queryResult = v2Response?.queryResult;
    const intent = queryResult?.intent;
    
    return {
      order: idx + 1,
      displayName: intent?.displayName || 'Unknown Intent',
      confidence: queryResult?.intentDetectionConfidence || 0,
      queryText: queryResult?.queryText || '',
      webhookStatus: v2Response?.webhookStatus?.message || null,
      isFallback: intent?.isFallback || false
    };
  });
}

/**
 * Refresh all data (History + Intents) while preserving selection state
 */
export async function refreshAllData() {
  const { openTabs, activeTabIndex, selectedSessionIndex } = await import('./dialogflow-store.js');
  
  // 1. Capture current state
  const currentTabs = get(openTabs);
  const currentIndex = get(activeTabIndex);
  const currentSessionIdx = get(selectedSessionIndex);
  
  // 2. Refresh data (preserve state = true)
  // Fetch both history and intents in parallel
  const [newData] = await Promise.all([
    fetchHistory(true),
    fetchAllIntents()
  ]);
  
  if (!newData) return;
  
  // 3. Update tabs with fresh data
  // We need to map old tabs to new data by Session ID to ensure we have the latest interactions
  if (currentTabs.length > 0) {
    const updatedTabs = currentTabs.map(tab => {
      // Find matching session in new data
      const match = newData.sessionConversations.find(
        (conv) => conv.conversationResponse?.sessionId === tab.sessionId
      );
      
      if (match) {
        // Update tab data with fresh match
        // Also update index if it changed (it might, if list order changed, though less likely with API)
        return {
          ...tab,
          index: match.no - 1, // 'no' is 1-based index from transformData
          data: match
        };
      }
      return tab; // Keep stale if not found (or should we close it?)
    });
    
    openTabs.set(updatedTabs);
    
    // Restore active tab index if valid
    if (currentIndex < updatedTabs.length) {
      activeTabIndex.set(currentIndex);
    } else {
      activeTabIndex.set(0);
    }
  }
  
  // 4. Restore selected session index if needed
  // (Note: The store logic often couples openTabs and selectedSessionIndex, so update might be sufficient)
}
