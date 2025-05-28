// This is a patch to fix the "defaultServerConditions is not iterable" error
import fs from 'fs';

// Path to the file with the issue
const filePath = './node_modules/vite-plugin-solid/dist/esm/index.mjs';

// Read the file
const file = fs.readFileSync(filePath, 'utf8');

// Replace the problematic code with a fixed version
const fixedFile = file.replace(
  `if (config.consumer === 'client' || name === 'client' || opts.isSsrTargetWebworker) {
          config.resolve.conditions = [...defaultClientConditions];
        } else {
          config.resolve.conditions = [...defaultServerConditions];
        }`,
  `if (config.consumer === 'client' || name === 'client' || opts.isSsrTargetWebworker) {
          config.resolve.conditions = defaultClientConditions ? [...defaultClientConditions] : ['browser', 'module', 'import', 'default'];
        } else {
          config.resolve.conditions = defaultServerConditions ? [...defaultServerConditions] : ['node', 'module', 'import', 'default'];
        }`
);

// Write the fixed file back
fs.writeFileSync(filePath, fixedFile);

console.log('Attempting to patch vite-plugin-solid...');
console.log(`Reading file: ${filePath}`);
console.log(`Original content snippet: ${file.substring(file.indexOf('if (config.consumer'), file.indexOf('if (config.consumer') + 200)}`);
console.log(`Fixed content snippet: ${fixedFile.substring(fixedFile.indexOf('if (config.consumer'), fixedFile.indexOf('if (config.consumer') + 200)}`);
console.log('vite-plugin-solid has been patched successfully!');
