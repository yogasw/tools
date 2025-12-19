import { get } from 'svelte/store';
import {
  configUrl,
  configAuthorization,
  configCookie,
  historyData,
  isLoading,
  error,
  resetState
} from './dialogflow-store.js';

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
export async function fetchHistory() {
  const url = get(configUrl);
  
  if (!url) {
    error.set('URL is required');
    return null;
  }
  
  isLoading.set(true);
  error.set(null);
  resetState();
  
  try {
    const headers = buildHeaders();
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const rawData = await response.json();
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
