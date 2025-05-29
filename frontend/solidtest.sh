#!/bin/bash

# I'm creating a comprehensive debug script for SolidStart layout issues
echo "🔍 SOLIDSTART LAYOUT SYSTEM DEBUG"
echo "=================================="

# Check current directory
echo "📍 Current directory: $(pwd)"

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in frontend directory. Please run from frontend/ folder"
    exit 1
fi

# Check SolidStart installation
echo ""
echo "📦 Package Check:"
echo "SolidStart version: $(npm list @solidjs/start 2>/dev/null | grep @solidjs/start || echo 'NOT FOUND')"
echo "SolidJS version: $(npm list solid-js 2>/dev/null | grep solid-js || echo 'NOT FOUND')"
echo "Vinxi version: $(npm list vinxi 2>/dev/null | grep vinxi || echo 'NOT FOUND')"

# Check file structure
echo ""
echo "📁 File Structure Check:"
echo "Routes directory:"
ls -la src/routes/ 2>/dev/null || echo "❌ src/routes/ not found"

echo ""
echo "Checking for _layout.tsx:"
if [ -f "src/routes/_layout.tsx" ]; then
    echo "✅ _layout.tsx found"
    echo "File size: $(wc -c < src/routes/_layout.tsx) bytes"
    echo "First line: $(head -1 src/routes/_layout.tsx)"
    echo "Last line: $(tail -1 src/routes/_layout.tsx)"
else
    echo "❌ _layout.tsx NOT found in src/routes/"
    echo "Searching for _layout.tsx anywhere:"
    find . -name "_layout.tsx" -type f 2>/dev/null || echo "No _layout.tsx found anywhere"
fi

# Check app.config.ts
echo ""
echo "⚙️ Configuration Check:"
if [ -f "app.config.ts" ]; then
    echo "✅ app.config.ts found"
    echo "SSR setting:"
    grep -n "ssr:" app.config.ts || echo "SSR setting not found"
else
    echo "❌ app.config.ts not found"
fi

# Check for TypeScript errors
echo ""
echo "🔧 TypeScript Check:"
npx tsc --noEmit --skipLibCheck 2>&1 | head -10 || echo "TypeScript check failed"

# Check node_modules
echo ""
echo "📚 Dependencies Check:"
if [ -d "node_modules/@solidjs/start" ]; then
    echo "✅ @solidjs/start installed"
else
    echo "❌ @solidjs/start not found in node_modules"
fi

echo ""
echo "🏁 Debug Summary Complete"
echo "If _layout.tsx exists but isn't working, this is likely a SolidStart configuration issue."
