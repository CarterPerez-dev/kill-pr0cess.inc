import fs from 'fs';
import path from 'path';

console.log('Applying vite-plugin-solid patch...');
const scriptCwd = process.cwd();
console.log('Script CWD:', scriptCwd);

const pluginPath = path.resolve(scriptCwd, './node_modules/vite-plugin-solid/dist/esm/index.mjs');
console.log('Attempting to patch file at:', pluginPath);

if (!fs.existsSync(pluginPath)) {
  console.log('Plugin file not found at path:', pluginPath);
  process.exit(1); // Exit with error if file not found
}

try {
  let content = fs.readFileSync(pluginPath, 'utf8');
  let madeChanges = false;

  // --- Client Conditions Patch ---
  const clientOriginal = 'config.resolve.conditions = [...defaultClientConditions];';
  const clientPatched = "config.resolve.conditions = Array.isArray(defaultClientConditions) ? [...new Set([...defaultClientConditions, 'solid', 'development'])] : ['solid', 'development', 'browser', 'module', 'import', 'default'];";

  if (content.includes(clientOriginal)) {
    console.log('Found original client conditions. Patching...');
    content = content.replace(clientOriginal, clientPatched);
    madeChanges = true;
  } else if (content.includes(clientPatched)) {
    console.log('Client conditions already patched.');
  } else {
    console.log(' Client conditions pattern not found. Original or Patched. Check vite-plugin-solid version/content.');
    // Optional: console.log a snippet for debugging
    // const clientSnippetIndex = content.indexOf('defaultClientConditions');
    // if (clientSnippetIndex > -1) {
    //     console.log("Client snippet:", content.substring(Math.max(0, clientSnippetIndex - 70), clientSnippetIndex + 120));
    // }
  }

  // --- Server Conditions Patch ---
  const serverOriginal = 'config.resolve.conditions = [...defaultServerConditions];';
  const serverPatched = "config.resolve.conditions = Array.isArray(defaultServerConditions) ? [...new Set([...defaultServerConditions, 'solid', 'development'])] : ['solid', 'development', 'node', 'module', 'import', 'default'];";

  if (content.includes(serverOriginal)) {
    console.log(' Found original server conditions. Patching...');
    content = content.replace(serverOriginal, serverPatched);
    madeChanges = true;
  } else if (content.includes(serverPatched)) {
    console.log(' Server conditions already patched.');
  } else {
    console.log(' Server conditions pattern not found. Original or Patched. Check vite-plugin-solid version/content.');
    // Optional: console.log a snippet for debugging
    // const serverSnippetIndex = content.indexOf('defaultServerConditions');
    // if (serverSnippetIndex > -1) {
    //     console.log("Server snippet:", content.substring(Math.max(0, serverSnippetIndex - 70), serverSnippetIndex + 120));
    // }
  }

  if (madeChanges) {
    fs.writeFileSync(pluginPath, content, 'utf8');
    console.log(' Successfully wrote changes to vite-plugin-solid!');
  } else {
    console.log(' No changes were made to the file (either already patched or patterns not found).');
  }

} catch (error) {
  console.error(' Error applying patch:', error.message, error.stack);
  process.exit(1);
}
