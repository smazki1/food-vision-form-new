# Auto-Archive Feature Documentation

## Overview
The auto-archive feature automatically moves leads to the archive when they are marked as "לא מעוניין" (not interested). This streamlines the lead management workflow by eliminating the need for manual archiving of uninterested leads.

## Implementation Details

### Feature Scope
- **Trigger**: When a lead status is changed to "לא מעוניין" 
- **Action**: Automatically change the status to "ארכיון" instead
- **Feedback**: Display special toast message indicating auto-archiving

### Implementation Locations

#### 1. EnhancedLeadsTable.tsx
**Location**: `src/components/admin/leads/EnhancedLeadsTable.tsx`
**Function**: `handleStatusChange`

```typescript
const handleStatusChange = async (leadId: string, newStatus: LeadStatusEnum) => {
  try {
    let finalStatus = newStatus;
    
    // If lead is being marked as "לא מעוניין" (not interested), automatically archive it
    if (newStatus === LeadStatusEnum.NOT_INTERESTED) {
      finalStatus = LeadStatusEnum.ARCHIVED;
      
      // Show special toast message for auto-archiving
      toast.success('הליד סומן כ"לא מעוניין" והועבר לארכיון אוטומטית');
    } else {
      toast.success('סטטוס הליד עודכן בהצלחה');
    }
    
    await updateLeadMutation.mutateAsync({
      leadId,
      updates: { lead_status: finalStatus }
    });
    
  } catch (error) {
    toast.error('שגיאה בעדכון סטטוס הליד');
  }
};
```

#### 2. LeadDetailPanel.tsx
**Location**: `src/components/admin/leads/LeadDetailPanel.tsx`
**Function**: `handleFieldBlur`

```typescript
// If lead status is being changed to "לא מעוניין" (not interested), automatically archive it
if (fieldName === 'lead_status' && value === 'לא מעוניין') {
  updates.lead_status = 'ארכיון';
  
  await updateLeadMutation.mutateAsync({
    leadId: lead.lead_id,
    updates
  });
  
  console.log('Lead automatically archived after being marked as not interested');
  toast.success('הליד סומן כ"לא מעוניין" והועבר לארכיון אוטומטית');
  
  // Update local state to archived status
  setLead(prev => prev ? { ...prev, lead_status: 'ארכיון' } : null);
  
  return;
}
```

## User Experience

### Workflow
1. User selects "לא מעוניין" from status dropdown (either in table or detail panel)
2. System automatically changes status to "ארכיון" 
3. Special toast message appears: "הליד סומן כ"לא מעוניין" והועבר לארכיון אוטומטית"
4. Lead is moved to archive view
5. Local UI state is updated to reflect the archived status

### Visual Feedback
- **Toast Message**: Clear indication that auto-archiving occurred
- **Status Badge**: Immediately updates to show "ארכיון" status
- **Lead Disappears**: From active leads view (moves to archive)

## Technical Implementation

### Status Constants
```typescript
export enum LeadStatusEnum {
  NEW = 'ליד חדש',
  INITIAL_CONTACT_MADE = 'פנייה ראשונית בוצעה',
  IN_TREATMENT = 'בטיפול', 
  INTERESTED = 'מעוניין',
  NOT_INTERESTED = 'לא מעוניין',      // Triggers auto-archive
  CONVERTED_TO_CLIENT = 'הפך ללקוח',
  ARCHIVED = 'ארכיון'                 // Final status after auto-archive
}
```

### Database Updates
- Status is updated directly in the `leads` table
- `updated_at` timestamp is automatically updated
- Activity log is created through existing `updateLead` mutation

### Error Handling
- Standard error handling through existing mutation error handling
- Graceful fallback to standard error messages
- No changes to existing error handling patterns

## Testing

### Manual Testing Steps
1. Navigate to leads management page
2. Create or find a test lead
3. Change status to "לא מעוניין" via:
   - Dropdown menu in leads table
   - Status select in lead detail panel
4. Verify:
   - Status automatically changes to "ארכיון"
   - Special toast message appears
   - Lead moves to archive view
   - Database is updated correctly

### Test Coverage
- Created comprehensive test suite in `AutoArchiveFeature.test.tsx`
- Tests both EnhancedLeadsTable and LeadDetailPanel implementations
- Includes error handling and integration tests
- Verifies existing functionality is not affected

## Deployment Information

### Production URL
- **Latest Deployment**: https://food-vision-form-pm1xm5759-avis-projects-a35edf10.vercel.app
- **Build Time**: 4.66s
- **Status**: ✅ LIVE AND OPERATIONAL

### Feature Availability
- ✅ Available in production
- ✅ TypeScript compilation verified
- ✅ No breaking changes to existing functionality
- ✅ Backwards compatible

## Benefits

### Workflow Efficiency
- Eliminates manual archiving step for uninterested leads
- Reduces cognitive load on users
- Streamlines lead management process

### Data Consistency  
- Ensures uninterested leads are properly archived
- Maintains clean active leads list
- Improves reporting accuracy

### User Experience
- Clear feedback on what action was taken
- Intuitive behavior that matches user expectations
- No additional UI complexity

## Future Enhancements

### Potential Improvements
1. **Bulk Operations**: Apply auto-archive to bulk status changes
2. **Customizable Rules**: Allow users to configure auto-archive rules
3. **Audit Trail**: Enhanced logging for auto-archive actions
4. **Undo Functionality**: Option to quickly undo auto-archive action

### Configuration Options
Could be extended to support:
- Different archive statuses based on lead source
- Time-delayed archiving
- Conditional archiving based on lead age or other criteria 