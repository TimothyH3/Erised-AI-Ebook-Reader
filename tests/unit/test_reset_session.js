/**
 * Test GeminiHeadlessClient resetSession functionality
 */

import { GeminiHeadlessClient } from '../../src/ai/gemini-headless.js';

console.log('=== TESTING GEMINI RESET SESSION CAPABILITY ===\n');

const client = new GeminiHeadlessClient();

// Simulate pre-existing tokens & conversation contexts
client.cachedCsrfToken = 'OLD_TEST_TOKEN_XYZ';
client.csrfTokenExpiry = Date.now() + 3600000;
client.conversationContext = {
  conversationId: 'c_old123',
  responseId: 'r_old456',
  choiceId: 'rc_old789'
};

console.log('Before reset:');
console.log('  cachedCsrfToken:', client.cachedCsrfToken);
console.log('  conversationContext:', client.conversationContext);

// Call resetSession()
// (In Node.js without Chrome cookies API, checkSession returns loggedIn: false)
client.resetSession().then(result => {
  console.log('\nAfter resetSession():');
  console.log('  cachedCsrfToken (should be null):', client.cachedCsrfToken);
  console.log('  conversationContext (should be cleared):', client.conversationContext);
  console.log('  Result:', result);

  if (client.cachedCsrfToken === null && client.conversationContext.conversationId === null) {
    console.log('\n✓ SUCCESS: resetSession completely purged tokens and conversation state.');
  } else {
    console.error('\n✗ FAIL: resetSession failed to purge tokens.');
  }
});

