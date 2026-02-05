#!/usr/bin/env node

/**
 * Directus Flow Recovery Script
 * 
 * This script helps fix the circular reference issue in Directus flows
 * that's causing the "Maximum call stack size exceeded" error.
 * 
 * Usage:
 * 1. If you have direct DB access: node scripts/fix-directus-flows.js --db-direct
 * 2. If using Railway: node scripts/fix-directus-flows.js --railway
 * 3. For SQL commands only: node scripts/fix-directus-flows.js --sql-only
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// SQL commands to fix the circular flow issue
const SQL_COMMANDS = {
  // Option 1: Disable all flows (fastest recovery)
  disableAllFlows: `
-- Disable all flows immediately to stop the crash
UPDATE directus_flows 
SET status = 'inactive' 
WHERE status = 'active';
  `,

  // Option 2: Inspect flows before disabling
  inspectFlows: `
-- See what flows exist and their status
SELECT 
  id, 
  name, 
  status, 
  trigger,
  created_at,
  updated_at
FROM directus_flows 
ORDER BY created_at DESC;
  `,

  // Option 3: Check for potential circular references
  checkCircularReferences: `
-- Look for flows that might have circular references
SELECT 
  f.id,
  f.name,
  f.status,
  f.trigger,
  o.type as operation_type,
  o.options as operation_options
FROM directus_flows f
LEFT JOIN directus_operations o ON o.flow = f.id
WHERE o.type = 'flow'
ORDER BY f.name;
  `,

  // Option 4: Delete specific problematic flow (use with caution)
  deleteFlowByName: (flowName) => `
-- Delete a specific flow by name (BE CAREFUL!)
DELETE FROM directus_operations WHERE flow IN (
  SELECT id FROM directus_flows WHERE name ILIKE '%${flowName}%'
);
DELETE FROM directus_flows WHERE name ILIKE '%${flowName}%';
  `
};

function executeRailwayCommand(command) {
  try {
    console.log(`🚀 Running Railway command: ${command}`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(result);
    return result;
  } catch (error) {
    console.error(`❌ Railway command failed: ${error.message}`);
    return null;
  }
}

function generateSQLCommands() {
  console.log('📋 SQL Commands to Fix Directus Flow Circular Reference\n');
  console.log('=== OPTION 1: IMMEDIATE FIX (Disable All Flows) ===\n');
  console.log(SQL_COMMANDS.disableAllFlows);
  console.log('\n=== OPTION 2: INSPECT FLOWS FIRST ===\n');
  console.log(SQL_COMMANDS.inspectFlows);
  console.log('\n=== OPTION 3: CHECK FOR CIRCULAR REFERENCES ===\n');
  console.log(SQL_COMMANDS.checkCircularReferences);
  console.log('\n=== OPTION 4: DELETE SPECIFIC FLOW (Replace "flow_name") ===\n');
  console.log(SQL_COMMANDS.deleteFlowByName('flow_name'));
}

async function fixViaRailway() {
  console.log('🔧 Attempting to fix via Railway CLI...\n');
  
  // Check if Railway CLI is installed
  try {
    execSync('railway version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Railway CLI not found. Install it with: npm install -g @railway/cli');
    return false;
  }

  // Get Railway service info
  console.log('📡 Getting Railway service information...');
  const serviceInfo = executeRailwayCommand('railway status --json');
  
  if (!serviceInfo) {
    console.error('❌ Could not connect to Railway. Make sure you\'re logged in: railway login');
    return false;
  }

  // Try to connect to database
  console.log('\n🗄️  Connecting to Railway database...');
  
  // Option 1: Use Railway's database proxy
  console.log('Attempting to connect via Railway database proxy...');
  
  try {
    // Get database connection string
    const dbUrl = executeRailwayCommand('railway variables get DATABASE_URL');
    
    if (dbUrl) {
      console.log('✅ Found DATABASE_URL. Executing fix...');
      
      // Create temporary SQL file
      const sqlFile = '/tmp/fix-directus-flows.sql';
      fs.writeFileSync(sqlFile, SQL_COMMANDS.disableAllFlows);
      
      // Execute SQL (this would need a DB client installed)
      console.log(`\n📝 SQL file created: ${sqlFile}`);
      console.log('Run this command manually to apply the fix:');
      console.log(`psql "${dbUrl.trim()}" -f ${sqlFile}`);
      
      return true;
    }
  } catch (error) {
    console.log('⚠️  Could not auto-execute SQL. Manual intervention required.');
  }

  return false;
}

async function main() {
  const args = process.argv.slice(2);
  
  console.log('🛠️  Directus Flow Recovery Tool\n');
  console.log('This tool fixes the "Maximum call stack size exceeded" error');
  console.log('caused by circular references in Directus flows.\n');

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage:');
    console.log('  node scripts/fix-directus-flows.js --sql-only     # Show SQL commands');
    console.log('  node scripts/fix-directus-flows.js --railway      # Try Railway CLI');
    console.log('  node scripts/fix-directus-flows.js --db-direct   # Direct DB access');
    process.exit(0);
  }

  if (args.includes('--sql-only')) {
    generateSQLCommands();
    return;
  }

  if (args.includes('--railway')) {
    const success = await fixViaRailway();
    if (!success) {
      console.log('\n📋 Falling back to SQL commands:');
      generateSQLCommands();
    }
    return;
  }

  if (args.includes('--db-direct')) {
    console.log('📋 Direct database access mode:');
    generateSQLCommands();
    console.log('\n💡 Connect to your database and run the SQL commands above.');
    return;
  }

  // Default: show options
  console.log('Please choose an option:\n');
  console.log('1. --sql-only     Show SQL commands to run manually');
  console.log('2. --railway      Try to fix via Railway CLI');
  console.log('3. --db-direct    For direct database access');
  console.log('4. --help         Show this help message\n');
  
  console.log('Example: node scripts/fix-directus-flows.js --sql-only');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SQL_COMMANDS, fixViaRailway, generateSQLCommands };
