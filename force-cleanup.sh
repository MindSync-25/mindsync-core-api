#!/bin/bash
echo "🧹 FORCE DELETE ALL UNWANTED FILES..."

# Remove all unwanted files using git
git rm -f server-database.js server-minimal.js server-simple.js server-smart.js server-ultra-minimal.js serverDynamo.js server-fixed.js 2>/dev/null
git rm -f quick-test.js simple-test.js test-*.js test-*.html railway-init.js syncModels.js 2>/dev/null
git rm -f deploy-*.ps1 start-*.ps1 restart-server.ps1 2>/dev/null
git rm -f *_STATUS.md *_DEPLOYMENT*.md *_INTEGRATION*.md HEROKU_*.md LEGENDARY_*.md IMMEDIATE_*.md LOCAL_*.md 2>/dev/null
git rm -f ALTERNATIVE_*.md AWS_*.md DEPLOYMENT_GUIDE.md DYNAMODB_MIGRATION.md FEATURE_DOCUMENTATION.md SYNC_*.md 2>/dev/null
git rm -f heroku-installer.exe package-production.json railway.json vercel.json 2>/dev/null
git rm -rf controllers routes 2>/dev/null

# Regular delete for files not in git
rm -f server-database.js server-minimal.js server-simple.js server-smart.js server-ultra-minimal.js serverDynamo.js server-fixed.js 2>/dev/null
rm -f quick-test.js simple-test.js test-*.js test-*.html railway-init.js syncModels.js 2>/dev/null
rm -f deploy-*.ps1 start-*.ps1 restart-server.ps1 2>/dev/null
rm -f *_STATUS.md *_DEPLOYMENT*.md *_INTEGRATION*.md HEROKU_*.md LEGENDARY_*.md IMMEDIATE_*.md LOCAL_*.md 2>/dev/null
rm -f ALTERNATIVE_*.md AWS_*.md DEPLOYMENT_GUIDE.md DYNAMODB_MIGRATION.md FEATURE_DOCUMENTATION.md SYNC_*.md 2>/dev/null
rm -f heroku-installer.exe package-production.json railway.json vercel.json 2>/dev/null
rm -rf controllers routes 2>/dev/null

# Clean up our own scripts
rm -f deploy-fix.bat massive-cleanup.bat force-cleanup.sh 2>/dev/null

echo "✅ FORCE CLEANUP COMPLETE!"
