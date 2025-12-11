# Profile Stats Fix - Thin-slice Patch

## Problem
Profile page stats ("Tasks I Created" / "Tasks I Helped") showed incorrect counts (0) on first render. They only updated after clicking the tab buttons.

## Root Cause
- `useTaskHistory` hook loads tasks based on `activeTab` (creator OR helper)
- Stats calculation depended on the filtered `tasks` array
- On initial render with `activeTab='creator'`, only creator tasks were loaded
- `stats.helpedCount` calculated from creator tasks → always 0

## Solution (Thin-slice)
Added new lightweight hook `useTaskStats` that:
- Loads ALL tasks from chain in one pass
- Counts creator/helper tasks independently
- Does NOT fetch metadata (stats only need counts)
- Does NOT interfere with existing `useTaskHistory` (used for task lists)

## Files Changed

### Added
- `frontend/src/hooks/useTaskStats.ts` - New hook for stats counting only

### Modified
- `frontend/src/pages/Profile.tsx` - Minimal changes:
  - Import `useTaskStats`
  - Replace stats calculation with `useTaskStats(provider, address)`
  - Add loading state to stats display
  - Remove unused `useMemo` import
  - **KEEP** `useTaskHistory` unchanged for task list tabs

## Implementation Details

### useTaskStats.ts
```typescript
export function useTaskStats(
  provider: ethers.Provider | null,
  address: string | null
): {
  stats: TaskStats;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}
```

**Key features:**
- Single pass over `tasks(1..taskCounter)`
- Counts both creator and helper in one loop
- No metadata fetching (performance optimized)
- Handles zero address for helper
- Graceful error handling per task

### Profile.tsx Changes
```typescript
// BEFORE: stats derived from filtered tasks
const stats = useMemo(() => {
  // ... calculated from tasks (filtered by activeTab)
}, [tasks, address]);

// AFTER: stats from independent hook
const { stats, loading: statsLoading } = useTaskStats(provider, address);
```

**Display update:**
```typescript
<div style={styles.statsNumber}>
  {statsLoading ? '...' : stats.createdCount}
</div>
```

## What Was NOT Changed
✅ `useTaskHistory.ts` - 100% unchanged  
✅ Task list rendering - unchanged  
✅ Tab switching logic - unchanged  
✅ Metadata fetching - unchanged  
✅ Task filtering - unchanged  
✅ Contracts/ABIs - unchanged  
✅ Encryption flow - unchanged  
✅ Routing - unchanged  

## Acceptance Criteria

### ✅ Primary Goal
- [ ] On first Profile page load (no tab clicks), stats show correct counts
- [ ] "Tasks I Created" shows actual creator count
- [ ] "Tasks I Helped" shows actual helper count

### ✅ No Regressions
- [ ] Clicking "Tasks I Created" tab still shows creator tasks
- [ ] Clicking "Tasks I Helped" tab still shows helper tasks
- [ ] Task list updates correctly when switching tabs
- [ ] Task metadata displays correctly in lists
- [ ] No errors in console
- [ ] No performance degradation

### ✅ Edge Cases
- [ ] Stats show 0 when no wallet connected
- [ ] Stats show "..." while loading
- [ ] Stats handle chain with no tasks (counter = 0)
- [ ] Stats handle tasks with zero address helper
- [ ] Stats continue counting if single task read fails

## Testing Steps

1. **Fresh Load Test**
   ```
   1. Connect wallet with existing tasks
   2. Navigate to Profile page
   3. Verify stats show correct counts immediately (no tab click needed)
   ```

2. **Tab Switch Test**
   ```
   1. Click "Tasks I Created" tab
   2. Verify list shows only creator tasks
   3. Click "Tasks I Helped" tab
   4. Verify list shows only helper tasks
   5. Verify stats remain correct throughout
   ```

3. **Empty State Test**
   ```
   1. Connect wallet with no tasks
   2. Verify stats show "0" for both
   3. No errors in console
   ```

4. **Loading State Test**
   ```
   1. Slow network simulation
   2. Verify stats show "..." while loading
   3. Verify stats update when loaded
   ```

## Performance Notes
- Stats hook makes ONE contract call (`taskCounter`) + N task reads
- No metadata fetching (faster than full task history)
- Runs in parallel with task history loading
- User sees stats immediately, task list loads separately

## Rollback Plan
If issues occur:
1. Remove `useTaskStats` import from Profile.tsx
2. Restore old `stats` calculation with `useMemo`
3. Delete `frontend/src/hooks/useTaskStats.ts`

## Next Steps
- [ ] Manual testing on dev environment
- [ ] Verify with multiple accounts (creator/helper/both)
- [ ] Check performance with large task counts
- [ ] Consider caching strategy if needed
