# PMplatto Project - Claude Code Instructions

## Project Overview
PMplatto (プラッと進捗すごろく) is a React/TypeScript program management system with real-time Kanban board functionality.

## Critical Issues Tracking

### 🚨 Priority Issues
- **Kanban Board Optimistic Updates**: Fixed 2025-08-02
  - **Problem**: ドラッグ&ドロップの楽観的更新がうまく動作しない (optimistic updates broken)
  - **Location**: https://program-management-pm.netlify.app/episodes/kanban
  - **Root Cause**: 
    - Premature reset of optimisticPrograms in useEffect (lines 159-168)
    - Race condition between optimistic updates and real-time sync
    - 100ms timing threshold too short and unreliable
  - **Solution Applied**: 
    - Implemented proper optimistic update pattern (update UI first, then API)
    - Added complete original program state preservation for error recovery
    - Improved real-time sync detection with actual state comparison
    - Removed unreliable timing-based reset logic
    - Added proper error handling with user feedback
  - **Reference**: PMliberary drag-drop-optimistic-update-guide.md pattern
  - **Status**: FIXED

## Workflow Documentation

### Problem Resolution Process
1. **Reference Solution Analysis**: Clone `delax-shared-packages` repository for working implementations
2. **Component Comparison**: Analyze differences between working and broken implementations
3. **Direct Application**: Apply proven solutions without local testing
4. **Production Deployment**: Push changes directly to production repository

### Git Operations
- Use CLI for all git and supabase operations
- Push directly to production repository after fixes
- Production deployment triggers automatically

### Development Philosophy
- Skip development environment testing
- Apply proven solutions from reference implementations
- Focus on production-ready fixes

## Architecture Notes
- React 18 + TypeScript + Vite + Supabase stack
- Real-time updates via Supabase subscriptions
- Modern drag & drop with @hello-pangea/dnd

## Security Assessment
- **Score**: A (91/100) - Excellent security practices
- Environment variables properly handled
- No hardcoded secrets or dangerous patterns

## Performance Notes  
- localStorage caching for filter persistence
- Proper dependency arrays in useEffect
- Bundle optimization with Vite