# Home Page Financial Dashboard Update

## Overview
This update transforms the Home page from a basic static dashboard to a comprehensive financial analytics dashboard with real-time data integration and advanced visualizations.

## Key Features Added

### 1. Real Database Integration
- **Before**: Static mock data for income, expenses, and account balances
- **After**: Dynamic data from actual budget transactions and accounts
- Uses `useTransactions` hook with filtered queries for income/expense categorization
- Automatic fallback to demo data when database is not available

### 2. Enhanced Summary Cards
- **Percentage Indicators**: Each card now shows relevant percentages
  - Income: Shows "100%" as baseline
  - Expenses: Shows percentage of income spent
  - Ending Balance: Shows net savings rate
  - Remaining Balance: Shows savings percentage
- **Updated Labels**: More descriptive card titles
- **Visual Consistency**: Maintains existing color scheme

### 3. Advanced Sankey Flow Diagram
- **Dynamic Data Visualization**: Chart automatically builds from real transaction categories
- **Percentage Labels**: Flow lines show percentage of total income
- **Improved Colors**: Brighter, more distinguishable colors for better visibility
- **Enhanced Text**: White text labels for better contrast
- **Optimized Layout**: Proper margins to prevent text overlap
- **Interactive Elements**: Hover effects and dynamic line widths based on flow values

### 4. Performance Optimizations
- **Smart Data Loading**: Conditional hook usage based on context availability
- **Memoized Calculations**: Efficient summary data computation
- **Responsive Design**: Chart adapts to different screen sizes

## Technical Changes

### Database Queries
```typescript
// Income transactions
const incomeQuery = q('transactions')
  .filter({ amount: { $gt: 0 } })
  .select(['*', { categoryName: { $id: '$category.name' } }])

// Expense transactions  
const expenseQuery = q('transactions')
  .filter({ amount: { $lt: 0 } })
  .select(['*', { categoryName: { $id: '$category.name' } }])
```

### Chart Enhancements
- Dynamic node and link generation from real data
- Percentage calculations relative to total income
- Enhanced visual styling with shadows and borders
- Improved color palette for better accessibility

## Files Modified
- `packages/desktop-client/src/components/Home.tsx` - Main component with all enhancements

## Dependencies Added
- `useTransactions` hook for database queries
- `q` function from `loot-core/shared/query` for query building

## Backward Compatibility
- Maintains all existing functionality
- Graceful fallback to demo data when database unavailable
- No breaking changes to existing APIs

## Installation
Apply the patch file to update existing installations:
```bash
git apply home-page-update.patch
```

## Visual Preview
The updated dashboard provides:
- Clear financial overview with percentages
- Interactive Sankey diagram showing money flow
- Real-time data updates from user's budget
- Professional styling with improved readability
