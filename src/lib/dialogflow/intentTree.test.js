/**
 * Unit test for buildIntentTree function
 * 
 * Expected tree structure (from Dialogflow console):
 * 
 * ads_reseller_konsul (ROOT)
 * └── ads_reseller_konsul_input_foto_1
 *     ├── ads_reseller_konsul_input_foto_1_fallback
 *     └── ads_reseller_konsul_input_foto_2
 *         ├── ads_reseller_konsul_input_foto_2_fallback
 *         └── ads_reseller_konsul_input_foto_3
 *             ├── ads_reseller_konsul_input_foto_3_fallback
 *             └── ads_reseller_konsul_assign_agent
 * 
 * test (ROOT - PARALLEL with ads_reseller_konsul)
 * ├── test - fallback
 * └── test - custom
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test data
const historyData = JSON.parse(readFileSync(join(__dirname, 'history_tmp.json'), 'utf-8'));
const intentData = JSON.parse(readFileSync(join(__dirname, 'intent_tmp.json'), 'utf-8'));

/**
 * Build hierarchical tree from intents using parent references
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
  
  // Step 5: Sort - roots alphabetically, children by history order then alphabetically
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
      interactions 
    };
  }
  
  return { roots, nodeMap, interactions };
}

/**
 * Helper to print tree structure for debugging
 */
function printTree(roots, indent = 0) {
  const lines = [];
  roots.forEach(node => {
    const prefix = '  '.repeat(indent);
    const activeMarker = node.active ? `(${node.history})` : '';
    const fallbackMarker = node.isFallback ? ' 🔖' : '';
    lines.push(`${prefix}${node.displayName}${fallbackMarker}${activeMarker}`);
    if (node.children.length > 0) {
      lines.push(...printTree(node.children, indent + 1));
    }
  });
  return lines;
}

/**
 * Get flat list of displayNames in tree order
 */
function getFlatTreeOrder(roots) {
  const result = [];
  function traverse(nodes) {
    nodes.forEach(node => {
      result.push(node.displayName);
      traverse(node.children);
    });
  }
  traverse(roots);
  return result;
}

// ============ RUN TESTS ============

console.log('=== Testing buildIntentTree ===\n');

// Test 1: All Intents mode (summaryOnly = false)
console.log('--- Test 1: All Intents Mode ---');
const sessionData = historyData.sessionConversations[0];
const allResult = buildIntentTree(intentData.intents, sessionData, false);

console.log('\nTree Structure:');
console.log(printTree(allResult.roots).join('\n'));

// Validate roots are parallel
const rootNames = allResult.roots.map(r => r.displayName);
console.log('\nRoots:', rootNames);

const expectedRoots = ['ads_reseller_konsul', 'test'];
const rootsMatch = JSON.stringify(rootNames) === JSON.stringify(expectedRoots);
console.log('✓ Roots are parallel (ads_reseller_konsul and test):', rootsMatch ? 'PASS' : 'FAIL');

// Validate tree order
const expectedAllOrder = [
  'ads_reseller_konsul',
  'ads_reseller_konsul_input_foto_1',
  'ads_reseller_konsul_input_foto_1_fallback',
  'ads_reseller_konsul_input_foto_2',
  'ads_reseller_konsul_input_foto_2_fallback',
  'ads_reseller_konsul_input_foto_3',
  'ads_reseller_konsul_assign_agent',
  'ads_reseller_konsul_input_foto_3_fallback',
  'test',
  'test - custom',
  'test - fallback'
];

const actualAllOrder = getFlatTreeOrder(allResult.roots);
console.log('\nExpected order:', expectedAllOrder);
console.log('Actual order:  ', actualAllOrder);

const allOrderMatch = JSON.stringify(actualAllOrder) === JSON.stringify(expectedAllOrder);
console.log('✓ Tree order matches:', allOrderMatch ? 'PASS' : 'FAIL');

// Test 2: Summary mode (summaryOnly = true) - only active intents
console.log('\n--- Test 2: Summary Mode ---');
const summaryResult = buildIntentTree(intentData.intents, sessionData, true);

console.log('\nSummary Tree Structure:');
console.log(printTree(summaryResult.roots).join('\n'));

// In summary mode, only intents in conversation should appear
const summaryNames = getFlatTreeOrder(summaryResult.roots);
console.log('\nSummary intents:', summaryNames);

// Intents in conversation (from history):
// 1. test
// 2. test - fallback
// 3. ads_reseller_konsul
// 4. ads_reseller_konsul_input_foto_1
// 5-8. ads_reseller_konsul_input_foto_1_fallback
// 9. ads_reseller_konsul_input_foto_2
// 10. ads_reseller_konsul_input_foto_3
// 11. ads_reseller_konsul_assign_agent

const expectedSummaryOrder = [
  'ads_reseller_konsul',
  'ads_reseller_konsul_input_foto_1',
  'ads_reseller_konsul_input_foto_1_fallback',
  'ads_reseller_konsul_input_foto_2',
  'ads_reseller_konsul_input_foto_3',
  'ads_reseller_konsul_assign_agent',
  'test',
  'test - fallback'
];

console.log('\nExpected summary order:', expectedSummaryOrder);
console.log('Actual summary order:  ', summaryNames);

const summaryOrderMatch = JSON.stringify(summaryNames) === JSON.stringify(expectedSummaryOrder);
console.log('✓ Summary order matches:', summaryOrderMatch ? 'PASS' : 'FAIL');

// Test 3: Validate interactions tracking
console.log('\n--- Test 3: Interactions Tracking ---');
console.log('Interactions map:');
allResult.interactions.forEach((val, key) => {
  const intent = allResult.nodeMap.get(key);
  console.log(`  ${intent?.displayName}: history=(${val.history}), count=${val.count}, first=${val.first}`);
});

// Summary
console.log('\n=== TEST SUMMARY ===');
const allPass = rootsMatch && allOrderMatch && summaryOrderMatch;
console.log(allPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

process.exit(allPass ? 0 : 1);
