# Project Rules

## Package Management Rules

### TipTap Version Synchronization
- **RULE**: All `@tiptap/*` packages MUST use the same version
- **ENFORCEMENT**: Use `npm ls @tiptap/react` to check current version
- **UPDATE PROCESS**: When updating TipTap, update ALL packages simultaneously:
  ```bash
  npm install @tiptap/react@X.Y.Z @tiptap/pm@X.Y.Z @tiptap/starter-kit@X.Y.Z @tiptap/extension-character-count@X.Y.Z @tiptap/extension-placeholder@X.Y.Z
  ```

### Current Package Versions (Last Updated: 2026-01-27)
- **TipTap**: 3.17.1 (all packages)
- **Next.js**: 16.0.10
- **React**: 19.2.0
- **fast-equals**: 5.4.0 (direct dependency)

### Dependency Installation Rules
1. **ALWAYS** run `npm ls` after installing new packages to check for conflicts
2. **NEVER** install individual TipTap packages - always update the entire suite
3. **USE** `--legacy-peer-deps` only as temporary fix, not permanent solution
4. **VERIFY** package versions after updates with `npm ls @package-name`

### Development Server Rules
1. **CLEAR cache** after dependency changes: `rm -rf .next`
2. **RESTART** dev server after package updates
3. **HARD REFRESH** browser after server restart

## Code Quality Rules

### Editor Dependencies
- **TipTap components** must import from synchronized package versions
- **CHECK** for HMR errors after dependency changes
- **REPORT** any fast-equals or module factory errors immediately

### Package.json Maintenance
- **KEEP** TipTap packages grouped together
- **MAINTAIN** consistent version across all TipTap dependencies
- **AUDIT** dependencies monthly for security updates

## Troubleshooting Rules

### Common Issues & Solutions
1. **fast-equals HMR Error**: 
   - Check TipTap version alignment
   - Clear .next cache
   - Restart dev server

2. **Module Factory Error**:
   - Verify ESM module handling in next.config.ts
   - Check webpack configuration
   - Ensure all dependencies installed

3. **Dependency Conflicts**:
   - Use `npm ls` to identify conflicts
   - Update conflicting packages to matching versions
   - Avoid mixing major versions

### Emergency Procedures
1. **BREAKING CHANGES**: Create new branch for major version updates
2. **HMR ISSUES**: Clear cache before escalating
3. **DEPENDENCY CONFLICTS**: Document solution in project README

## Enforcement

### Pre-commit Checks
- Verify TipTap package versions are synchronized
- Check for dependency conflicts with `npm ls`
- Ensure no duplicate package versions

### Update Procedures
1. **MINOR UPDATES**: Can be done in main branch
2. **MAJOR UPDATES**: Create feature branch, test thoroughly
3. **BREAKING CHANGES**: Require PR review and testing

### Documentation Requirements
- Update this file when package versions change
- Document any special configuration requirements
- Note any workarounds or temporary fixes
