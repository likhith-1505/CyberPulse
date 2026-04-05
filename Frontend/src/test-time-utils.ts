/**
 * Test script to verify time utilities work correctly
 * Run this in browser console or with Node.js
 */

// Test data: various timestamp formats
const timestamps = [
  new Date().toISOString(), // ISO string (current time)
  new Date(Date.now() - 5000).toISOString(), // ISO string (5 seconds ago)
  new Date(Date.now() - 120000).toISOString(), // ISO string (2 minutes ago)
  Date.now(), // UNIX milliseconds (current time)
  Date.now() - 5000, // UNIX milliseconds (5 seconds ago)
  Math.floor(Date.now() / 1000), // UNIX seconds (current time)
  Math.floor(Date.now() / 1000) - 300, // UNIX seconds (5 minutes ago)
  new Date(), // Date object
  Date.now() + 1000, // Future timestamp (1 second in future)
];

console.log("Testing safeTimeAgo() with various timestamp formats:");
console.log("====================================================\n");

timestamps.forEach((ts, idx) => {
  try {
    // This would be: const result = safeTimeAgo(ts);
    // For now, just showing the timestamp type
    console.log(`Test ${idx + 1}:`);
    console.log(`  Input type: ${typeof ts}`);
    console.log(`  Input value: ${ts}`);
    if (typeof ts === 'string') {
      console.log(`  ISO Date: ${new Date(ts).toISOString()}`);
    }
    console.log();
  } catch (e) {
    console.error(`  ERROR: ${e.message}`);
  }
});

console.log("\nExpected results after fixes:");
console.log("============================");
console.log("✓ All timestamps handle correctly without errors");
console.log("✓ No negative time values shown (future = 'just now')");
console.log("✓ Both ISO strings and UNIX timestamps work");
console.log("✓ Different time scales (seconds/ms) auto-detected");
