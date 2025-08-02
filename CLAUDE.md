# PMplatto Project - Claude Code Instructions

## Project Overview
PMplatto (プラッと進捗すごろく) is a React/TypeScript program management system with real-time Kanban board functionality.

## Critical Issues Tracking

### 🚨 Priority Issues
- **Kanban Board Real-time Drag & Drop**: Fixed 2025-08-02
  - **Problem**: ドラッグ&ドロップがリアルタイムで反映されない
  - **Location**: https://delaxplatto.com/kanban 
  - **Solution Applied**: 
    - Fixed `DropResult` type import from `@hello-pangea/dnd`
    - Improved error handling with optimistic updates
    - Enhanced real-time synchronization with Supabase

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