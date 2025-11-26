# Installation Guide - Home Page Financial Dashboard Update

## Prerequisites

- Actual Budget application (existing installation)
- Git installed on your system
- Basic understanding of React components

## Installation Methods

### Method 1: Git Patch Application (Recommended)

1. **Navigate to your Actual Budget root directory:**

   ```bash
   cd /path/to/your/actual-budget
   ```

2. **Create a backup of your current Home component:**

   ```bash
   cp packages/desktop-client/src/components/Home.tsx packages/desktop-client/src/components/Home.tsx.backup
   ```

3. **Apply the patch:**

   ```bash
   git apply home-page-update/home-page-update.patch
   ```

4. **Restart your development server:**
   ```bash
   yarn start:browser
   ```

### Method 2: Manual File Replacement

1. **Backup existing file:**

   ```bash
   cp packages/desktop-client/src/components/Home.tsx packages/desktop-client/src/components/Home.tsx.backup
   ```

2. **Replace the Home component:**

   - Copy the contents from the patch file
   - Replace the entire `packages/desktop-client/src/components/Home.tsx` file

3. **Restart your development server:**
   ```bash
   yarn start:browser
   ```

## Verification

### 1. Check Application Start

After installation, your application should start without errors. Check the console for any issues.

### 2. Navigate to Home Page

Go to the Home page and verify:

- ✅ Summary cards display with percentages
- ✅ Sankey chart renders correctly
- ✅ Real data loads (if you have transactions)
- ✅ Demo data displays (if no transactions exist)

### 3. Test Features

- **Hover over flow lines** - Should show percentage tooltips
- **Check summary cards** - Should display percentage indicators
- **Verify data accuracy** - Numbers should match your actual budget data

## Troubleshooting

### Common Issues

#### 1. Import Errors

```
Error: Cannot resolve module 'loot-core/shared/query'
```

**Solution:** Ensure you're using the correct import path without the `@` prefix.

#### 2. Hook Errors

```
Error: useTransactions is not a function
```

**Solution:** Verify the `useTransactions` hook exists in your version of Actual Budget.

#### 3. Chart Not Rendering

**Symptoms:** Empty chart area or loading indefinitely
**Solutions:**

- Check browser console for JavaScript errors
- Verify ECharts library is properly loaded
- Ensure transaction data is available

#### 4. Percentage Calculations

**Symptoms:** Incorrect percentages or NaN values
**Solutions:**

- Check that income data exists and is greater than 0
- Verify transaction amounts are in the correct format (pence/cents)

### Rollback Instructions

If you encounter issues, you can easily rollback:

```bash
# Restore from backup
cp packages/desktop-client/src/components/Home.tsx.backup packages/desktop-client/src/components/Home.tsx

# Or use git (if you have uncommitted changes)
git checkout packages/desktop-client/src/components/Home.tsx

# Restart server
yarn start:browser
```

## Configuration Options

### Data Source Fallback

The component automatically detects data availability:

- **Real Data Mode**: When connected to a budget with transactions
- **Demo Mode**: When no real data is available (safe fallback)

### Customization Points

You can customize these aspects without breaking functionality:

1. **Colors**: Modify the color constants in the chart configuration
2. **Percentages**: Adjust calculation methods for different business logic
3. **Chart Layout**: Modify margins and spacing in chart options
4. **Card Labels**: Update text content in the summary data section

## Support

### Getting Help

1. **Check Console**: Look for JavaScript errors in browser console
2. **Review Logs**: Check development server logs for build errors
3. **Verify Dependencies**: Ensure all required hooks and utilities are available

### Reporting Issues

When reporting issues, please include:

- Browser version and type
- Node.js and Yarn versions
- Console error messages
- Steps to reproduce the issue
- Whether you have real transaction data or using demo mode

## Next Steps

After successful installation:

1. **Explore Features**: Try hovering over different chart elements
2. **Add Real Data**: Input some transactions to see real data visualization
3. **Customize**: Modify colors or layout to match your preferences
4. **Backup**: Create a backup of your working installation

Enjoy your enhanced financial dashboard! 🎉
