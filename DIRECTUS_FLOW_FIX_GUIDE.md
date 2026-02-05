# Directus Flow Circular Reference Fix

## 🚨 Problem Summary
Your Directus instance is crashing in a restart loop because of a **circular reference in your Flows**. The error `RangeError: Maximum call stack size exceeded` occurs when Directus tries to build the flow execution tree during startup.

## ⚡ Immediate Fix Options

### Option 1: Disable All Flows (Fastest Recovery)
```sql
UPDATE directus_flows 
SET status = 'inactive' 
WHERE status = 'active';
```

### Option 2: Inspect First, Then Fix
```sql
-- See what flows exist
SELECT id, name, status, trigger, created_at, updated_at
FROM directus_flows 
ORDER BY created_at DESC;

-- Then disable problematic ones
UPDATE directus_flows 
SET status = 'inactive' 
WHERE status = 'active';
```

### Option 3: Find the Circular Flow
```sql
-- Look for flows that call other flows
SELECT 
  f.id, f.name, f.status, f.trigger,
  o.type as operation_type, o.options as operation_options
FROM directus_flows f
LEFT JOIN directus_operations o ON o.flow = f.id
WHERE o.type = 'flow'
ORDER BY f.name;
```

## 🔧 How to Apply the Fix

### Via Railway Dashboard (Recommended)
1. Go to your Railway project
2. Click on your Directus service
3. Go to the "Variables" tab
4. Add temporary variable: `FLOWS_ENABLED=false`
5. Redeploy the service
6. Once running, remove the variable and fix flows in UI

### Via Database Access
1. Connect to your Railway PostgreSQL database
2. Run the SQL commands above
3. Restart the Directus service

### Using the Recovery Script
```bash
# Show SQL commands
node scripts/fix-directus-flows.js --sql-only

# Try Railway CLI (requires installation)
npm install -g @railway/cli
node scripts/fix-directus-flows.js --railway
```

## 🎯 Root Cause Patterns That Trigger This

### 🚨 Direct Self-Loop
- Flow A → runs Flow A

### 🚨 Indirect Loop (Most Common)
- Flow A → runs Flow B
- Flow B → runs Flow A

### 🚨 Event-Trigger Loop
- Flow triggered on `items.create`
- Flow creates items in same collection
- Infinite recursion during tree construction

### 🚨 Operation-Level Loop
- "Run another flow" operation points back upstream

## 🛡️ Prevention Guidelines

### Flow Design Rules
1. **Never mutate the triggering collection** without guards
2. **Avoid "Run another flow"** unless 100% acyclic
3. **Use accountability guards**:
   ```javascript
   if ($trigger.context.accountability?.admin !== true)
   ```
4. **Add processed flags**:
   ```javascript
   if (data.processed === true) return;
   data.processed = true;
   ```

### Safe Flow Patterns
- One "dispatcher" flow calling multiple simple flows
- Event flows that only modify different collections
- Admin-only flows with accountability checks
- Batch processing with status flags

## 🔄 Recovery Process

1. **Immediate**: Disable all flows to restore service
2. **Investigation**: Identify the circular flow using the SQL queries
3. **Fix**: Redesign the problematic flow(s)
4. **Test**: Re-enable flows one by one
5. **Monitor**: Watch for stack overflow errors

## 📞 Next Steps

1. **Run the immediate fix** to get Directus back online
2. **Check your flows** for the patterns above
3. **Implement prevention guidelines** for future flow development

Once Directus is running again, I can help you identify exactly which flow was causing the issue and redesign it safely.
