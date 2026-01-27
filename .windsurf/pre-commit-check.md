# Pre-commit Checklist

## Package Management Checklist

### Before Committing Dependency Changes
- [ ] Run `npm ls @tiptap/react` and verify all TipTap packages have same version
- [ ] Check for dependency conflicts with `npm ls`
- [ ] Clear .next cache if dependencies changed
- [ ] Test dev server starts without errors
- [ ] Verify no HMR errors in browser console

### TipTap Version Verification
```bash
# Check current versions
npm ls @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-character-count @tiptap/extension-placeholder

# All should show same version number
```

### After Package Updates
- [ ] Update .windsurf/rules.md with new versions
- [ ] Test editor functionality
- [ ] Verify no module factory errors
- [ ] Check browser console for HMR issues

## Code Quality Checklist

### Editor Components
- [ ] All TipTap imports use correct package versions
- [ ] No hardcoded version numbers in imports
- [ ] Editor loads without dependency errors

### Build Verification
- [ ] `npm run build` completes successfully
- [ ] No webpack warnings about dependencies
- [ ] All editor features work in production build

## Emergency Rollback Procedure

If dependency changes break the editor:
1. **Immediate rollback**: `git reset --hard HEAD~1`
2. **Clean cache**: `rm -rf .next node_modules package-lock.json`
3. **Fresh install**: `npm install`
4. **Verify**: `npm run dev`

## Required Commands for Dependency Updates

### Safe TipTap Update Process
```bash
# 1. Check current versions
npm ls @tiptap/react

# 2. Update all TipTap packages together
npm install @tiptap/react@X.Y.Z @tiptap/pm@X.Y.Z @tiptap/starter-kit@X.Y.Z @tiptap/extension-character-count@X.Y.Z @tiptap/extension-placeholder@X.Y.Z

# 3. Verify versions match
npm ls @tiptap/react @tiptap/pm @tiptap/starter-kit

# 4. Clear cache and test
rm -rf .next
npm run dev

# 5. Test editor functionality
# 6. Update documentation
# 7. Commit changes
```

### Conflict Resolution
```bash
# Check for conflicts
npm ls

# Fix with legacy peer deps (temporary)
npm install --legacy-peer-deps

# Or downgrade conflicting packages
npm install @conflicting-package@compatible-version
```
