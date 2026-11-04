/**
 * Test Gemini Image Extraction & Data URL Pipeline
 */

import { GeminiHeadlessClient } from './modules/gemini-headless.js';

console.log('=== TESTING GEMINI IMAGE PIPELINE & DATA URL SYNTHESIS ===\n');

const client = new GeminiHeadlessClient();

// 1. Verify URL extraction from realistic StreamGenerate responses
const streamSample1 = `)]}'
284
[["wrb.fr",null,"[[\\"c_9999\\",\\"r_8888\\",null,null,null,1],null,\\"Here is your illustration: ![Scene](https:\\\\/\\\\/lh3.googleusercontent.com\\\\/gg-dl\\\\/AF9QhPQTyZ_1234567890abcdefghijklmnopqrstuvwxyz-ABCDEF123456=s0)\\\\n\\\\nLet me know if you would like any modifications.\\"]"]]`;

const extracted1 = client.extractGoogleImageUrl(streamSample1);
console.log('Test 1 (Markdown with escaped JSON slashes):');
console.log('  Extracted:', extracted1);
if (!extracted1 || !extracted1.includes('gg-dl/AF9QhPQTyZ_1234567890abcdefghijklmnopqrstuvwxyz-ABCDEF123456=s1200')) {
  throw new Error(`Test 1 Failed: ${extracted1}`);
}
console.log('  [PASS]\n');

// 2. Test direct URL with placeholder present earlier in the stream
const streamSample2 = `)]}'
512
[["wrb.fr",null,"http://googleusercontent.com/image_generation_content/0"]]
[["wrb.fr",null,"[[\\"https:\\\\/\\\\/lh4.googleusercontent.com\\\\/gg-dl\\\\/SECOND_IMAGE_TOKEN_XYZ987=w800-h800\\",1024,1024]]]"]`;

const extracted2 = client.extractGoogleImageUrl(streamSample2);
console.log('Test 2 (Placeholder accompanied by real gg-dl asset):');
console.log('  Extracted:', extracted2);
if (!extracted2 || !extracted2.includes('SECOND_IMAGE_TOKEN_XYZ987=w1200-h1200')) {
  throw new Error(`Test 2 Failed: ${extracted2}`);
}
console.log('  [PASS]\n');

// 3. Test arrayBufferToDataUrl
console.log('Test 3 (Binary ArrayBuffer to Data URL conversion):');
const mockBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]); // PNG signature
const dataUrl = client.arrayBufferToDataUrl(mockBytes.buffer, 'image/png');
console.log('  Generated Data URL:', dataUrl);
if (!dataUrl.startsWith('data:image/png;base64,')) {
  throw new Error(`Test 3 Failed: Invalid Data URL ${dataUrl}`);
}
console.log('  [PASS]\n');

// 4. Test sanitizePromptForImageSafety
console.log('Test 4 (Gothic safety sanitization & nested prefix stripping):');
const rawGothicPrompt = `Fine-art book plate illustration depicting: The dissecting room and the slaughter-house furnished many of my materials; and often did my human nature turn with loathing from my occupation, whilst, still urged on by an eagerness which perpetually increased, I brought my work near to a conclusion. I collected bones from charnel-houses and disturbed, with profane fingers, the tremendous secrets of the human frame. A lifeless thing lay before him as the corpse stirred. Aspect ratio: 16:9. Strictly zero typography, words, or letters.`;

const sanitized = client.sanitizePromptForImageSafety(rawGothicPrompt);
console.log('  Sanitized Prompt:\n  ', sanitized);

if (sanitized.includes('dissecting room') || sanitized.includes('slaughter-house') || sanitized.includes('charnel-houses') || sanitized.includes('corpse') || sanitized.includes('lifeless thing')) {
  throw new Error(`Test 4 Failed: Sensitive policy trigger keywords were not replaced: ${sanitized}`);
}
if (sanitized.includes('Fine-art book plate illustration depicting:') || sanitized.includes('Aspect ratio: 16:9')) {
  throw new Error(`Test 4 Failed: Redundant prefixes or trailing metadata were not stripped: ${sanitized}`);
}
console.log('  [PASS]\n');

// 5. Test Dynamic Build Label URL Generation
console.log('Test 5 (Dynamic Build Label in StreamGenerate URL):');
client.cachedBuildLabel = 'boq_assistant-bard-web-server_20261028.08_p0';
const dynamicStreamUrl = client.getStreamUrl(123456);
console.log('  Stream URL:', dynamicStreamUrl);
if (!dynamicStreamUrl.includes('bl=boq_assistant-bard-web-server_20261028.08_p0') || !dynamicStreamUrl.includes('_reqid=123456')) {
  throw new Error(`Test 5 Failed: Dynamic build label not incorporated into StreamGenerate URL`);
}
console.log('  [PASS]\n');

// 6. Test Avatar filter precision vs valid image tokens
console.log('Test 6 (Avatar filtering vs valid image URLs with /a/ tokens):');
const avatarPayload = `)]}'\n[["wrb.fr",null,"https:\\/\\/lh3.googleusercontent.com\\/a\\/ACg8ocIS0meUserAvatar123=s96-c"]]`;
const avatarResult = client.extractGoogleImageUrl(avatarPayload);
if (avatarResult !== null) {
  throw new Error(`Test 6a Failed: Avatar URL should be rejected but got: ${avatarResult}`);
}

const validTokenWithA = `)]}'\n[["wrb.fr",null,"https:\\/\\/lh3.googleusercontent.com\\/gg-dl\\/a_valid_generated_token_xyz=s0"]]`;
const validResult = client.extractGoogleImageUrl(validTokenWithA);
if (!validResult || !validResult.includes('gg-dl/a_valid_generated_token_xyz=s1200')) {
  throw new Error(`Test 6b Failed: Valid token containing /a was mistakenly rejected: ${validResult}`);
}
console.log('  [PASS]\n');

// 7. Test Gemini refusal / text explanation extraction
console.log('Test 7 (Gemini text response extraction on refusal/no-image):');
const refusalPayload = `)]}'
410
[["wrb.fr",null,"[[\\"c_123\\",\\"r_456\\"],null,\\"I am unable to generate images depicting human remains, dissection, or violence according to my safety guidelines.\\"]"]]`;
const refusalText = client.extractGeminiText(refusalPayload);
console.log('  Extracted text:', refusalText);
if (!refusalText || !refusalText.includes('safety guidelines')) {
  throw new Error(`Test 7 Failed: Could not extract Gemini explanation text: ${refusalText}`);
}
console.log('  [PASS]\n');

console.log('=== ALL GEMINI IMAGE PIPELINE TESTS COMPLETED SUCCESSFULLY ===');

