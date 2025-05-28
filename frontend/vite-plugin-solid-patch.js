/*
 * Simplified and focused patch for vite-plugin-solid to fix the "defaultServerConditions is not iterable" error.
 * I'm implementing a targeted fix that directly addresses the core issue without over-complicating the solution.
 */

import fs from 'fs';

console.log('🔧 Applying vite-plugin-solid patch...');

// I'm finding the plugin file
const pluginPath = './node_modules/vite-plugin-solid/dist/esm/index.mjs';

if (!fs.existsSync(pluginPath)) {
  console.log('ℹ️  Plugin file not found, patch may not be needed');
  process.exit(0);
}

try {
  // I'm reading the current content
  let content = fs.readFileSync(pluginPath, 'utf8');

  // I'm checking if patch is already applied
  if (content.includes('Array.isArray') && content.includes('defaultClientConditions')) {
    console.log('✅ Patch already applied');
    process.exit(0);
  }

  // I'm applying the core fix for the spread operator issue
  const originalPattern = /config\.resolve\.conditions = \[\.\.\.default(Client|Server)Conditions\]/g;

  if (content.match(originalPattern)) {
    console.log('🎯 Found problematic spread patterns, fixing...');

    content = content.replace(
      /config\.resolve\.conditions = \[\.\.\.defaultClientConditions\]/g,
      'config.resolve.conditions = Array.isArray(defaultClientConditions) ? [...defaultClientConditions] : [\'browser\', \'module\', \'import\', \'default\']'
    );

    content = content.replace(
      /config\.resolve\.conditions = \[\.\.\.defaultServerConditions\]/g,
      'config.resolve.conditions = Array.isArray(defaultServerConditions) ? [...defaultServerConditions] : [\'node\', \'module\', \'import\', \'default\']'
    );

    // I'm writing the fixed content
    fs.writeFileSync(pluginPath, content);
    console.log('✅ Successfully patched vite-plugin-solid!');
  } else {
    console.log('ℹ️  No problematic patterns found, patch may not be needed');
  }

} catch (error) {
  console.error('❌ Error applying patch:', error.message);
  process.exit(1);
}
