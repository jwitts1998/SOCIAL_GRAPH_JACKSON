# Deployment Plan: Web & Mobile

**Date**: 2025-02-01  
**Status**: Planning  
**Estimated Total Effort**: 8-12 weeks (depending on mobile approach)

---

## Executive Summary

This document outlines the deployment strategy and effort estimates for deploying Social Graph Connector to:
1. **Web** - Production web deployment (multiple platform options)
2. **Mobile** - Native mobile apps (iOS/Android) or Progressive Web App (PWA)

**Current State:**
- ✅ Web app is functional and build-ready
- ✅ Edge Functions have CI/CD via GitHub Actions
- ✅ Responsive design exists (mobile-friendly)
- ❌ No production web deployment configured
- ❌ No mobile app exists (only design spec)
- ❌ No PWA capabilities

---

## Part 1: Web Deployment

### Current State Assessment

**Strengths:**
- Build scripts ready (`npm run build` → `dist/`)
- Express server configured for production (`NODE_ENV=production`)
- Static file serving configured
- Environment variables documented
- Edge Functions already deployed to Supabase

**Gaps:**
- Replit-specific plugins in `vite.config.ts` (need conditional removal)
- No CI/CD for web app deployment
- No production environment configuration
- No domain/SSL setup
- OAuth callback URLs need production configuration
- No health checks or monitoring

### Deployment Options

#### Option A: Vercel (Recommended for Simplicity)
**Effort**: 2-3 days  
**Cost**: Free tier available, scales with usage

**Pros:**
- Zero-config deployment for React apps
- Automatic SSL, CDN, edge functions
- Built-in CI/CD via GitHub
- Environment variable management
- Preview deployments for PRs

**Cons:**
- Express backend needs separate deployment (or convert to serverless functions)
- May need to split frontend/backend

**Tasks:**
1. Remove Replit-specific Vite plugins (conditional)
2. Create `vercel.json` configuration
3. Set up Vercel project and connect GitHub
4. Configure environment variables
5. Update OAuth callback URLs
6. Deploy and test
7. Set up custom domain (optional)

**Estimated Effort**: 6-8 hours

---

#### Option B: Railway (Recommended for Full-Stack)
**Effort**: 3-4 days  
**Cost**: $5-20/month

**Pros:**
- Full-stack deployment (frontend + Express backend)
- PostgreSQL available (though using Supabase)
- Simple Docker-based deployment
- Environment variable management
- Built-in monitoring

**Cons:**
- Requires Dockerfile creation
- Slightly more complex than Vercel

**Tasks:**
1. Create `Dockerfile` for Node.js app
2. Create `railway.json` or use Railway UI
3. Configure build and start commands
4. Set environment variables
5. Deploy and test
6. Configure custom domain

**Estimated Effort**: 8-12 hours

---

#### Option C: Render
**Effort**: 3-4 days  
**Cost**: Free tier available, $7-25/month for production

**Pros:**
- Full-stack support
- Auto-deploy from GitHub
- Free SSL
- Environment variable management

**Cons:**
- Similar to Railway, requires Dockerfile
- Free tier has limitations (spins down after inactivity)

**Tasks:**
1. Create `Dockerfile`
2. Create `render.yaml` configuration
3. Set up Render service
4. Configure environment variables
5. Deploy and test

**Estimated Effort**: 8-12 hours

---

#### Option D: AWS/GCP/Azure (Enterprise)
**Effort**: 1-2 weeks  
**Cost**: Variable, typically $20-100/month

**Pros:**
- Full control and scalability
- Enterprise-grade infrastructure
- Advanced monitoring and logging

**Cons:**
- Complex setup
- Requires infrastructure knowledge
- Higher cost
- Overkill for MVP

**Tasks:**
1. Set up cloud account and billing
2. Create infrastructure as code (Terraform/CloudFormation)
3. Set up CI/CD pipeline
4. Configure load balancer, SSL, CDN
5. Set up monitoring and alerting
6. Deploy and test

**Estimated Effort**: 2-3 weeks

---

### Recommended Web Deployment Plan

**Phase 1: Quick Win (Vercel Frontend + Railway Backend)**
- Deploy frontend to Vercel: **4 hours**
- Deploy backend to Railway: **6 hours**
- Total: **1-2 days**

**Phase 2: Production Hardening**
- Set up custom domain: **2 hours**
- Configure SSL: **1 hour** (automatic with Vercel/Railway)
- Set up monitoring: **4 hours**
- Performance optimization: **4 hours**
- Total: **1-2 days**

**Total Web Deployment Effort: 2-4 days**

---

## Part 2: Mobile Deployment

### Current State Assessment

**Strengths:**
- Comprehensive mobile design spec exists
- Responsive web design already implemented
- Core functionality (recording, transcription, matching) works

**Gaps:**
- No mobile app code exists
- No PWA capabilities
- No native mobile features (push notifications, background audio, etc.)
- Design spec calls for native iOS/Android apps

### Mobile Deployment Options

#### Option A: Progressive Web App (PWA) - Fastest Path
**Effort**: 1-2 weeks  
**Cost**: No additional cost (uses web deployment)

**Pros:**
- Reuses existing React codebase
- Single codebase for all platforms
- Faster to market
- Lower maintenance
- Can be installed on home screen
- Works offline (with service worker)

**Cons:**
- Limited native features (no background recording, limited push notifications)
- iOS PWA limitations (no background audio recording)
- May not meet design spec requirements (native feel)
- App store distribution requires wrapper (e.g., Capacitor)

**Tasks:**
1. Add PWA manifest (`manifest.json`): **2 hours**
2. Create service worker for offline support: **8 hours**
3. Add install prompt UI: **2 hours**
4. Test on iOS/Android browsers: **4 hours**
5. Optimize for mobile performance: **8 hours**
6. Add app icons and splash screens: **2 hours**
7. Test offline functionality: **4 hours**

**Estimated Effort**: 1-2 weeks

**Limitations:**
- iOS Safari doesn't support background audio recording
- May need Capacitor wrapper for App Store distribution

---

#### Option B: React Native - Cross-Platform Native
**Effort**: 6-8 weeks  
**Cost**: No additional infrastructure cost

**Pros:**
- Single codebase for iOS and Android
- Native performance and features
- Can share business logic with web
- Access to native APIs (camera, microphone, contacts, calendar)
- App Store distribution

**Cons:**
- Significant development effort
- Different UI framework (React Native vs React)
- Need to rebuild UI components
- Native module setup for audio/transcription
- Testing on both platforms

**Tasks:**
1. Set up React Native project: **4 hours**
2. Create shared business logic layer: **1 week**
3. Rebuild UI components in React Native: **2-3 weeks**
4. Implement native audio recording: **1 week**
5. Implement native transcription (on-device or API): **1 week**
6. Implement native contacts/calendar integration: **1 week**
7. Testing and bug fixes: **1-2 weeks**
8. App Store setup and submission: **1 week**

**Estimated Effort**: 6-8 weeks

---

#### Option C: Native iOS (Swift/SwiftUI) + React Native Android
**Effort**: 8-12 weeks  
**Cost**: No additional infrastructure cost

**Pros:**
- Best native experience on iOS
- Follows design spec exactly
- Full access to iOS features (Speech framework, Core Data, etc.)
- Optimal performance

**Cons:**
- Two separate codebases to maintain
- Highest development effort
- Requires Swift/iOS expertise
- Android parity comes later

**Tasks:**

**iOS (Swift/SwiftUI):**
1. Set up Xcode project: **4 hours**
2. Implement data models (Contact, Thesis, Conversation): **1 week**
3. Implement audio recording: **1 week**
4. Implement on-device transcription (Speech framework): **1 week**
5. Implement entity extraction (local or API): **1 week**
6. Implement matching algorithm: **1 week**
7. Build UI (SwiftUI): **2-3 weeks**
8. Implement contacts/calendar integration: **1 week**
9. Testing and App Store submission: **1-2 weeks**

**Android (React Native):**
1. Set up React Native project: **4 hours**
2. Port business logic: **1 week**
3. Rebuild UI: **2 weeks**
4. Implement native modules: **1 week**
5. Testing and Play Store submission: **1 week**

**Estimated Effort**: 8-12 weeks (iOS first, then Android)

---

#### Option D: Capacitor (Hybrid Approach)
**Effort**: 2-3 weeks  
**Cost**: No additional infrastructure cost

**Pros:**
- Reuses existing React web code
- Native plugin ecosystem
- Can access native features (camera, microphone, etc.)
- App Store distribution
- Faster than full native rewrite

**Cons:**
- Still web-based (not true native)
- Performance may not match native
- Plugin compatibility issues
- iOS background limitations

**Tasks:**
1. Set up Capacitor project: **4 hours**
2. Add native plugins (audio, contacts, calendar): **1 week**
3. Configure iOS/Android projects: **1 week**
4. Test native features: **1 week**
5. App Store setup and submission: **1 week**

**Estimated Effort**: 2-3 weeks

---

### Recommended Mobile Deployment Plan

**Phase 1: PWA (Quick Win) - 1-2 weeks**
- Add PWA capabilities to existing web app
- Test on mobile browsers
- Evaluate if PWA meets requirements

**Phase 2: Native Mobile (If PWA insufficient) - 6-8 weeks**
- Start with React Native for cross-platform
- Or native iOS if design spec requires it
- Android can follow iOS

**Total Mobile Deployment Effort: 1-2 weeks (PWA) or 6-8 weeks (Native)**

---

## Combined Deployment Strategy

### Recommended Approach

**Web Deployment (Week 1):**
1. Deploy frontend to Vercel: **Day 1-2**
2. Deploy backend to Railway: **Day 2-3**
3. Production hardening: **Day 3-4**

**Mobile Deployment (Week 2-3 or Week 2-9):**
- **Option 1 (Fast)**: PWA - Add PWA capabilities: **Week 2-3**
- **Option 2 (Comprehensive)**: React Native - Build cross-platform app: **Week 2-9**

### Total Timeline

**Minimum (PWA):** 2-3 weeks  
**Comprehensive (Native):** 8-12 weeks

---

## Risk Assessment

### Web Deployment Risks
- **Low Risk**: Well-established platforms (Vercel, Railway)
- **Medium Risk**: OAuth callback URL configuration
- **Mitigation**: Test in staging environment first

### Mobile Deployment Risks
- **High Risk (Native)**: Significant development effort, may delay other features
- **Medium Risk (PWA)**: iOS limitations may not meet requirements
- **Mitigation**: Start with PWA, evaluate, then decide on native

---

## Cost Estimates

### Web Deployment
- **Vercel**: Free tier (sufficient for MVP), $20/month for team
- **Railway**: $5-20/month depending on usage
- **Total**: $5-40/month

### Mobile Deployment
- **PWA**: $0 (uses web infrastructure)
- **React Native/Native**: $0 (development only, uses same infrastructure)
- **App Store Fees**: $99/year (Apple), $25 one-time (Google)

**Total Monthly Cost**: $5-40/month + App Store fees

---

## Success Criteria

### Web Deployment
- ✅ App accessible via custom domain
- ✅ SSL certificate active
- ✅ All features working in production
- ✅ OAuth flows working
- ✅ Edge Functions accessible
- ✅ Performance acceptable (< 3s load time)

### Mobile Deployment
- ✅ App installable on iOS/Android
- ✅ Core features work offline (PWA) or natively (Native)
- ✅ Audio recording works
- ✅ Transcription functional
- ✅ Matching algorithm works
- ✅ App Store approval (if native)

---

## Next Steps

1. **Review and confirm approach** (this document)
2. **Create task.yml file** with detailed tasks
3. **Prioritize**: Web first, then mobile
4. **Start with PWA** for mobile (fastest path)
5. **Evaluate PWA** after 2 weeks, decide on native if needed

---

## Questions to Resolve

1. **Web Platform**: Vercel + Railway, or single platform?
2. **Mobile Approach**: PWA first, or go straight to native?
3. **Timeline**: Fast (PWA) or comprehensive (Native)?
4. **Budget**: Monthly hosting budget?
5. **Custom Domain**: Do we have a domain already?

---

## Appendix: Detailed Task Breakdowns

### Web Deployment Tasks (Vercel + Railway)

#### Frontend (Vercel)
1. Remove Replit-specific code from `vite.config.ts`
2. Create `vercel.json` with build configuration
3. Set up Vercel project and connect GitHub repo
4. Configure environment variables in Vercel dashboard
5. Update OAuth callback URLs in Google Cloud Console
6. Deploy and verify
7. Set up custom domain (if available)
8. Configure preview deployments for PRs

#### Backend (Railway)
1. Create `Dockerfile` for Node.js Express app
2. Create `railway.json` or configure via Railway UI
3. Set up Railway project
4. Configure environment variables
5. Set build and start commands
6. Deploy and verify
7. Update frontend API URLs to point to Railway backend
8. Test OAuth flow end-to-end

### Mobile Deployment Tasks (PWA)

1. Create `manifest.json` with app metadata
2. Create service worker (`sw.js`) for offline support
3. Register service worker in `main.tsx`
4. Add install prompt component
5. Create app icons (multiple sizes for iOS/Android)
6. Add splash screens
7. Test offline functionality
8. Test on iOS Safari and Android Chrome
9. Optimize bundle size for mobile
10. Add mobile-specific UI improvements

---

**Document Status**: Ready for Review  
**Next Action**: Review with team, confirm approach, create task.yml

