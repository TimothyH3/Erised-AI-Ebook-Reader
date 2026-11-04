/**
 * Test arrayBufferToDataUrl utility
 */

function arrayBufferToDataUrl(arrayBuffer, mimeType = 'image/png') {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  const base64 = (typeof btoa !== 'undefined') 
    ? btoa(binary) 
    : Buffer.from(binary, 'binary').toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

const dummyBuffer = new Uint8Array(100000);
for (let i = 0; i < dummyBuffer.length; i++) {
  dummyBuffer[i] = i % 256;
}

const dataUrl = arrayBufferToDataUrl(dummyBuffer.buffer, 'image/jpeg');
console.log('Data URL starts with:', dataUrl.substring(0, 40));
console.log('Data URL length:', dataUrl.length);
console.log('Passed:', dataUrl.startsWith('data:image/jpeg;base64,') && dataUrl.length > 100000);

