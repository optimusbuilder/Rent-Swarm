# Session Persistence Implementation Plan

## Goal
Persist user data across page refreshes/navigation within the same browser tab/session, but clear when the tab is closed. This applies to Chat, Lawyer, Forecaster, and Haggler pages.

## Storage Strategy: SessionStorage

**Why SessionStorage?**
- ✅ Persists across page refreshes
- ✅ Automatically clears when tab/window closes
- ✅ Isolated per tab (each tab has independent state)
- ✅ 5-10MB storage limit (plenty for our use case)
- ✅ Synchronous API (easier than IndexedDB)
- ❌ NOT shared across tabs (perfect for this requirement)

**Alternative Rejected:**
- LocalStorage: Persists even after closing tab (NOT what you want)
- MongoDB: Server-side, not local (Chat already uses this for long-term history)
- IndexedDB: Overkill, more complex

## Architecture

### Overall Flow

```
User Action → Update React State → Save to SessionStorage
     ↓
Page Refresh/Navigate
     ↓
Component Mount → Load from SessionStorage → Restore React State
     ↓
Tab Close → SessionStorage Cleared (automatic)
```

### Files to Create

1. **`lib/hooks/useSessionStorage.ts`** - Reusable React hook
   - Generic hook for any component to persist state
   - Handles JSON serialization/deserialization
   - TypeScript support with generics

2. **`lib/utils/session-storage.ts`** - Helper utilities
   - Type-safe wrapper around sessionStorage API
   - Namespace keys to avoid collisions
   - Error handling for quota exceeded

### Files to Modify

1. **`app/(dashboard)/chat/page.tsx`**
   - Persist: messages array, sessionId, input value
   - Restore on mount

2. **`app/(dashboard)/lawyer/page.tsx`**
   - Persist: uploaded file metadata, analysis results, extracted PDF text
   - Restore on mount

3. **`app/(dashboard)/forecaster/page.tsx`**
   - Persist: listing data, commute results, calculated metrics
   - Restore on mount

4. **`app/(dashboard)/negotiate/page.tsx`**
   - Persist: listing data, generated emails, negotiation strategy
   - Restore on mount

## Detailed Implementation Plan

### Phase 1: Create Reusable Infrastructure

#### 1.1 SessionStorage Helper (`lib/utils/session-storage.ts`)

```typescript
// Namespaced keys to avoid collisions
const NAMESPACE = 'rent-swarm';

export const sessionStorage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = window.sessionStorage.getItem(`${NAMESPACE}:${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`SessionStorage get error for key ${key}:`, error);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      window.sessionStorage.setItem(`${NAMESPACE}:${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`SessionStorage set error for key ${key}:`, error);
      // Handle quota exceeded
      if (error.name === 'QuotaExceededError') {
        console.warn('SessionStorage quota exceeded, clearing old data');
        this.clear();
      }
    }
  },

  remove(key: string): void {
    window.sessionStorage.removeItem(`${NAMESPACE}:${key}`);
  },

  clear(): void {
    // Only clear our namespaced keys
    Object.keys(window.sessionStorage).forEach(key => {
      if (key.startsWith(NAMESPACE)) {
        window.sessionStorage.removeItem(key);
      }
    });
  }
};
```

#### 1.2 React Hook (`lib/hooks/useSessionStorage.ts`)

```typescript
import { useState, useEffect } from 'react';
import { sessionStorage } from '@/lib/utils/session-storage';

export function useSessionStorage<T>(key: string, initialValue: T) {
  // Initialize state from sessionStorage or use initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue; // SSR safety
    }
    return sessionStorage.get<T>(key, initialValue);
  });

  // Update sessionStorage whenever state changes
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function (like useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        sessionStorage.set(key, valueToStore);
      }
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
```

### Phase 2: Implement Per-Page Persistence

#### 2.1 Chat Page (`app/(dashboard)/chat/page.tsx`)

**State to Persist:**
```typescript
interface ChatSessionState {
  messages: Array<{ role: string; content: string }>;
  sessionId: string | null;
  inputValue: string;
}
```

**Implementation:**
```typescript
const [chatState, setChatState] = useSessionStorage<ChatSessionState>('chat-session', {
  messages: [],
  sessionId: null,
  inputValue: '',
});

// Use chatState.messages instead of local messages state
// Update chatState whenever messages change
```

**Benefits:**
- User can refresh and continue conversation
- Input field value persists
- SessionId maintained for continuity

**Considerations:**
- Chat already uses MongoDB for long-term persistence
- SessionStorage is for UI state only (current session)
- MongoDB still stores conversation history permanently

---

#### 2.2 Lawyer Page (`app/(dashboard)/lawyer/page.tsx`)

**State to Persist:**
```typescript
interface LawyerSessionState {
  uploadedFile: {
    name: string;
    size: number;
    type: string;
    uploadedAt: string;
  } | null;
  analysisResult: {
    summary: string;
    flags: Array<RiskFlag>;
    jurisdiction: string;
    extractedText: string;
  } | null;
  selectedJurisdiction: string;
}
```

**Implementation:**
```typescript
const [lawyerState, setLawyerState] = useSessionStorage<LawyerSessionState>('lawyer-session', {
  uploadedFile: null,
  analysisResult: null,
  selectedJurisdiction: 'auto',
});

// After PDF upload success
setLawyerState(prev => ({
  ...prev,
  uploadedFile: { name, size, type, uploadedAt: new Date().toISOString() },
  analysisResult: response.data,
}));
```

**Benefits:**
- Analysis results persist across refreshes
- User doesn't need to re-upload PDF
- Jurisdiction selection persists

**Limitations:**
- Cannot store actual File object (not serializable)
- Store metadata only, not binary data
- User must re-upload if they close tab

---

#### 2.3 Forecaster Page (`app/(dashboard)/forecaster/page.tsx`)

**State to Persist:**
```typescript
interface ForecasterSessionState {
  listing: {
    id: string;
    address: string;
    city: string;
    price: number;
    beds: number;
    baths: number;
    sqft: number;
  } | null;
  commuteData: {
    workAddress: string;
    commuteTime: number;
    commuteMode: string;
    estimatedCost: number;
  } | null;
  calculations: {
    pricePerSqft: number;
    affordability: string;
    monthlyUtilities: number;
    totalMonthlyCost: number;
  } | null;
}
```

**Implementation:**
```typescript
const [forecasterState, setForecasterState] = useSessionStorage<ForecasterSessionState>('forecaster-session', {
  listing: null,
  commuteData: null,
  calculations: null,
});
```

**Benefits:**
- Listing details persist
- Commute calculations persist
- User can refresh and see results

---

#### 2.4 Negotiate/Haggler Page (`app/(dashboard)/negotiate/page.tsx`)

**State to Persist:**
```typescript
interface NegotiateSessionState {
  listing: {
    id: string;
    address: string;
    city: string;
    price: number;
    beds: number;
    baths: number;
    sqft: number;
  } | null;
  generatedEmails: Array<{
    tone: string;
    content: string;
    generatedAt: string;
  }>;
  selectedTone: string;
  customInstructions: string;
}
```

**Implementation:**
```typescript
const [negotiateState, setNegotiateState] = useSessionStorage<NegotiateSessionState>('negotiate-session', {
  listing: null,
  generatedEmails: [],
  selectedTone: 'professional',
  customInstructions: '',
});
```

**Benefits:**
- Generated emails persist (don't regenerate on refresh)
- Listing details persist
- User preferences persist

---

### Phase 3: User Experience Enhancements

#### 3.1 Visual Indicators

Add UI feedback to show data was restored:

```typescript
// In each page component
const [wasRestored, setWasRestored] = useState(false);

useEffect(() => {
  if (chatState.messages.length > 0) {
    setWasRestored(true);
    setTimeout(() => setWasRestored(false), 3000);
  }
}, []);

// In JSX
{wasRestored && (
  <div className="bg-blue-100 text-blue-800 p-2 rounded mb-4">
    ✓ Previous session restored
  </div>
)}
```

#### 3.2 Clear Session Button

Add optional "Clear Session" button on each page:

```typescript
<button
  onClick={() => {
    setChatState({ messages: [], sessionId: null, inputValue: '' });
    // OR
    sessionStorage.remove('chat-session');
  }}
  className="text-sm text-gray-600 hover:text-gray-800"
>
  Clear Session
</button>
```

#### 3.3 Automatic Cleanup

Optional: Clear very old sessions (if user keeps tab open for days):

```typescript
interface SessionData<T> {
  data: T;
  timestamp: number;
}

// In sessionStorage helper
const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

export function getWithExpiry<T>(key: string, defaultValue: T): T {
  const item = sessionStorage.get<SessionData<T>>(key, null);

  if (!item) return defaultValue;

  const now = Date.now();
  if (now - item.timestamp > MAX_AGE) {
    sessionStorage.remove(key);
    return defaultValue;
  }

  return item.data;
}
```

---

## Edge Cases & Considerations

### 1. Large Data Sizes

**Problem:** PDF analysis results with long extracted text might exceed sessionStorage quota

**Solution:**
- Store summary/flags only, not full extractedText
- Or compress with LZ-string library
- Or use IndexedDB for large blobs (future enhancement)

### 2. Tab Cloning

**Problem:** User duplicates tab (Ctrl+Shift+T) - both tabs share sessionStorage

**Solution:**
- Accept this behavior (reasonable for user workflows)
- Or generate unique tab IDs and namespace by tab

### 3. Navigation Between Pages

**Problem:** User goes Chat → Lawyer → Chat. Should Chat state persist?

**Solution:**
- Yes! Each page has its own namespaced key
- Chat state: `rent-swarm:chat-session`
- Lawyer state: `rent-swarm:lawyer-session`
- Independent persistence

### 4. Server-Side Rendering (Next.js)

**Problem:** `window.sessionStorage` not available during SSR

**Solution:**
- Already handled in `useSessionStorage` hook
- Check `typeof window === 'undefined'`
- Return initialValue during SSR

---

## Migration & Rollout

### Step 1: Create Infrastructure (Low Risk)
- Add `lib/utils/session-storage.ts`
- Add `lib/hooks/useSessionStorage.ts`
- No user-facing changes yet

### Step 2: Test on One Page (Chat)
- Implement on Chat page only
- Test thoroughly:
  - Refresh during conversation
  - Close tab and reopen
  - Navigate away and back
  - Multiple tabs

### Step 3: Roll Out to Other Pages
- Lawyer page
- Forecaster page
- Negotiate page

### Step 4: Add UX Enhancements
- Restoration indicators
- Clear session buttons
- Error handling

---

## Testing Plan

### Manual Testing

**Chat Page:**
1. Send 3 messages
2. Refresh page → Messages should persist
3. Close tab → Reopen → Messages should be cleared
4. Open in new tab → Should be empty (independent session)

**Lawyer Page:**
1. Upload PDF, get analysis
2. Refresh page → Analysis should persist
3. Close tab → Reopen → Should be cleared
4. Try with large PDF (5MB) → Check if quota exceeded

**Forecaster Page:**
1. Enter listing data, calculate commute
2. Refresh → Data should persist
3. Navigate to Chat and back → Data should persist
4. Close tab → Reopen → Should be cleared

**Negotiate Page:**
1. Generate 3 email variations
2. Refresh → Emails should persist
3. Close tab → Reopen → Should be cleared

### Edge Case Testing

- Fill sessionStorage to quota (upload huge PDFs) → Graceful handling
- Open 10 tabs → Each independent
- SSR/client hydration → No errors
- Corrupt sessionStorage data → Fallback to defaults

---

## Rollback Plan

If issues arise:
1. Feature flag the hook usage
2. Remove sessionStorage calls
3. Revert to original state-only implementation
4. No data loss (sessionStorage is additive)

---

## Implementation Timeline

**Day 1: Infrastructure**
- Create sessionStorage utilities
- Create useSessionStorage hook
- Unit tests

**Day 2: Chat Page**
- Implement persistence
- Test thoroughly
- User feedback

**Day 3: Other Pages**
- Lawyer page
- Forecaster page
- Negotiate page

**Day 4: Polish**
- UX indicators
- Clear session buttons
- Documentation

---

## Alternative Approaches Considered

### 1. URL Query Parameters
**Pros:** Shareable links
**Cons:** Large data, security concerns, ugly URLs
**Verdict:** ❌ Not suitable

### 2. LocalStorage
**Pros:** Persists after tab close
**Cons:** Doesn't meet requirement (want to clear on close)
**Verdict:** ❌ Wrong tool

### 3. Cookies
**Pros:** Server-accessible
**Cons:** 4KB limit, sent with every request (overhead)
**Verdict:** ❌ Too limited

### 4. IndexedDB
**Pros:** Large storage (50MB+), asynchronous
**Cons:** More complex, overkill for simple state
**Verdict:** 🔄 Future enhancement if needed

### 5. Zustand/Redux with sessionStorage middleware
**Pros:** Global state management
**Cons:** Adds dependency, more complex
**Verdict:** 🤔 Could simplify if state gets complex

---

## Summary

**What We're Building:**
- Lightweight session persistence using browser sessionStorage
- Reusable React hook for easy implementation
- Per-page state that survives refreshes but clears on tab close
- No backend changes needed

**Benefits:**
- Better UX (no lost work on refresh)
- Simple implementation (native browser API)
- Privacy-friendly (clears on tab close)
- No backend load

**Next Step:**
- Review this plan
- Approve or request changes
- Begin implementation Phase 1

---

## Questions for Review

1. **Storage Limit:** 5-10MB sessionStorage should be enough. Do any pages need more?
2. **Chat & MongoDB:** Chat already uses MongoDB for long-term storage. Should sessionStorage only store UI state, or replace MongoDB for active sessions?
3. **Clear Button:** Should we add explicit "Clear Session" buttons, or is tab close enough?
4. **Visual Feedback:** Do you want a toast/banner when session is restored?
5. **Expiry:** Should sessions expire after 24 hours if tab stays open, or persist indefinitely while tab is open?

Please review and let me know if this approach looks good, or if you'd like any changes!
