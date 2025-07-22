import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import { format } from 'date-fns';

import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { Text } from '@actual-app/components/text';
import { Button } from '@actual-app/components/button';

import { useAccounts } from '@desktop-client/hooks/useAccounts';
import { useCategories } from '@desktop-client/hooks/useCategories';
import { useSyncedPref } from '@desktop-client/hooks/useSyncedPref';
import { useTransactions } from '@desktop-client/hooks/useTransactions';
import { q } from 'loot-core/shared/query';

export function Home() {
  const { t } = useTranslation();
  const chartRef = useRef<ReactECharts>(null);

  // Force chart resize after mount to ensure proper rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      if (chartRef.current) {
        const chartInstance = chartRef.current.getEchartsInstance();
        chartInstance?.resize();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Try to get real data, but fallback to demo data if not available
  let accounts = [];
  let categories = [];
  let hideFraction = false;

  // Check if we're in a context where these hooks can work
  const canUseHooks = typeof window !== 'undefined' && window.__actionsForMenu;

  if (canUseHooks) {
    try {
      accounts = useAccounts() || [];
      const categoriesResult = useCategories();
      categories = categoriesResult?.list || [];
      const [hideFractionValue] = useSyncedPref('hideFraction');
      hideFraction = hideFractionValue || false;
    } catch (error) {
      console.warn('Backend not available, using demo data:', error);
    }
  }

  // Queries for real transaction data
  const incomeQuery = useMemo(
    () =>
      q('transactions')
        .filter({ amount: { $gt: 0 } })
        .select([
          '*',
          {
            categoryName: { $id: '$category.name' },
            categoryIncome: { $id: '$category.is_income' },
          },
        ])
        .orderBy({ date: 'desc' }),
    [],
  );

  const expenseQuery = useMemo(
    () =>
      q('transactions')
        .filter({ amount: { $lt: 0 } })
        .select([
          '*',
          {
            categoryName: { $id: '$category.name' },
            categoryIncome: { $id: '$category.is_income' },
          },
        ])
        .orderBy({ date: 'desc' }),
    [],
  );

  // Use real transaction data if available
  const incomeTransactionResult = canUseHooks
    ? useTransactions({
        query: incomeQuery,
        options: { pageCount: 1000 },
      })
    : { transactions: [], isLoading: false };

  const expenseTransactionResult = canUseHooks
    ? useTransactions({
        query: expenseQuery,
        options: { pageCount: 1000 },
      })
    : { transactions: [], isLoading: false };

  // Currency formatting function - updated to GBP
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(amount / 100); // Convert from cents to pounds
  }, []);

  // Process real transaction data by category
  const incomeData = useMemo(() => {
    if (!canUseHooks || !incomeTransactionResult.transactions.length) {
      // Fallback to demo data if no real data available
      return {
        data: [
          { category: 'salary', amount: 350000 }, // £3,500 in pence
          { category: 'freelance', amount: 80000 }, // £800 in pence
          { category: 'investments', amount: 25000 }, // £250 in pence
        ],
        isLoading: false,
      };
    }

    // Group income transactions by category and sum amounts
    const categoryTotals = new Map();
    incomeTransactionResult.transactions.forEach(transaction => {
      const categoryName = transaction.categoryName || 'Uncategorized';
      const existing = categoryTotals.get(categoryName) || 0;
      categoryTotals.set(categoryName, existing + transaction.amount);
    });

    // Convert to array format
    const data = Array.from(categoryTotals.entries()).map(
      ([category, amount]) => ({
        category: category.toLowerCase().replace(/\s+/g, '-'),
        categoryName: category,
        amount: amount,
      }),
    );

    return {
      data,
      isLoading: incomeTransactionResult.isLoading,
    };
  }, [
    canUseHooks,
    incomeTransactionResult.transactions,
    incomeTransactionResult.isLoading,
  ]);

  const expenseData = useMemo(() => {
    if (!canUseHooks || !expenseTransactionResult.transactions.length) {
      // Fallback to demo data if no real data available
      return {
        data: [
          { category: 'groceries', amount: -45000 }, // £450 in pence
          { category: 'utilities', amount: -18000 }, // £180 in pence
          { category: 'transport', amount: -12000 }, // £120 in pence
          { category: 'entertainment', amount: -8000 }, // £80 in pence
          { category: 'dining', amount: -15000 }, // £150 in pence
        ],
        isLoading: false,
      };
    }

    // Group expense transactions by category and sum amounts
    const categoryTotals = new Map();
    expenseTransactionResult.transactions.forEach(transaction => {
      const categoryName = transaction.categoryName || 'Uncategorized';
      const existing = categoryTotals.get(categoryName) || 0;
      categoryTotals.set(categoryName, existing + transaction.amount);
    });

    // Convert to array format
    const data = Array.from(categoryTotals.entries()).map(
      ([category, amount]) => ({
        category: category.toLowerCase().replace(/\s+/g, '-'),
        categoryName: category,
        amount: amount,
      }),
    );

    return {
      data,
      isLoading: expenseTransactionResult.isLoading,
    };
  }, [
    canUseHooks,
    expenseTransactionResult.transactions,
    expenseTransactionResult.isLoading,
  ]);

  const accountBalances = useMemo(() => {
    if (!canUseHooks || !accounts.length) {
      // Fallback to demo data if no real data available
      return {
        data: [
          { id: '1', name: 'Current Account', balance: 250000 }, // £2,500
          { id: '2', name: 'Savings Account', balance: 1500000 }, // £15,000
        ],
        isLoading: false,
      };
    }

    // Use real account data
    const data = accounts.map(account => ({
      id: account.id,
      name: account.name,
      balance: account.balance || 0,
    }));

    return {
      data,
      isLoading: false,
    };
  }, [canUseHooks, accounts]);

  // Calculate summary data from real budget data
  const summaryData = useMemo(() => {
    const totalIncome =
      incomeData.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const totalExpenses = Math.abs(
      expenseData.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0,
    );
    const netIncome = totalIncome - totalExpenses;
    const totalBalance =
      accountBalances.data?.reduce(
        (sum, account) => sum + (account.balance || 0),
        0,
      ) || 0;

    // Calculate percentages like in the reference image
    const incomePercentage = totalIncome > 0 ? '100%' : '0%';
    const expensePercentage = totalIncome > 0 ? `${((totalExpenses / totalIncome) * 100).toFixed(0)}%` : '0%';
    const netIncomePercentage = totalIncome > 0 ? `${((netIncome / totalIncome) * 100).toFixed(0)}%` : '0%';
    const savingsRate = totalIncome > 0 ? `${((netIncome / totalIncome) * 100).toFixed(0)}%` : '0%';

    return {
      income: {
        amount: totalIncome,
        label: 'Income',
        color: '#10B981',
        percentage: incomePercentage
      },
      expenses: {
        amount: totalExpenses,
        label: 'Expenses',
        color: '#F59E0B',
        percentage: expensePercentage
      },
      netIncome: {
        amount: netIncome,
        label: 'Ending Balance',
        color: '#3B82F6',
        percentage: netIncomePercentage
      },
      totalBalance: {
        amount: totalBalance,
        label: 'Remaining Balance until 2025',
        color: '#8B5CF6',
        percentage: savingsRate
      },
    };
  }, [incomeData.data, expenseData.data, accountBalances.data]);

  // Mock categories for chart generation
  const mockCategories = [
    { id: 'salary', name: 'Salary' },
    { id: 'freelance', name: 'Freelance' },
    { id: 'investments', name: 'Investments' },
    { id: 'groceries', name: 'Groceries' },
    { id: 'utilities', name: 'Utilities' },
    { id: 'transport', name: 'Transport' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'dining', name: 'Dining Out' },
  ];

  // Use real categories if available, otherwise use mock
  const activeCategories = categories.length > 0 ? categories : mockCategories;

  // Dynamic Sankey chart data using real financial data
  const sankeyData = useMemo(() => {
    const nodes = [];
    const links = [];

    // If no real data available, use demo structure
    if (!incomeData.data.length && !expenseData.data.length) {
      return {
        nodes: [
          { name: 'Salary (Income)', category: 'income' },
          { name: 'Freelance (Income)', category: 'income' },
          { name: 'Investments (Income)', category: 'income' },
          { name: 'Total Income', category: 'flow' },
          { name: 'Groceries', category: 'expense' },
          { name: 'Utilities', category: 'expense' },
          { name: 'Transport', category: 'expense' },
          { name: 'Entertainment', category: 'expense' },
          { name: 'Dining Out', category: 'expense' },
          { name: 'Net Savings', category: 'savings' },
        ],
        links: [
          { source: 'Salary (Income)', target: 'Total Income', value: 350000 },
          {
            source: 'Freelance (Income)',
            target: 'Total Income',
            value: 80000,
          },
          {
            source: 'Investments (Income)',
            target: 'Total Income',
            value: 25000,
          },
          { source: 'Total Income', target: 'Groceries', value: 45000 },
          { source: 'Total Income', target: 'Utilities', value: 18000 },
          { source: 'Total Income', target: 'Transport', value: 12000 },
          { source: 'Total Income', target: 'Entertainment', value: 8000 },
          { source: 'Total Income', target: 'Dining Out', value: 15000 },
          { source: 'Total Income', target: 'Net Savings', value: 357000 },
        ],
      };
    }

    // Add income category nodes and links
    incomeData.data.forEach(item => {
      if (item.amount > 0) {
        const nodeName = `${item.categoryName || item.category} (Income)`;
        nodes.push({ name: nodeName, category: 'income' });
        links.push({
          source: nodeName,
          target: 'Total Income',
          value: Math.abs(item.amount),
        });
      }
    });

    // Add central flow node
    nodes.push({ name: 'Total Income', category: 'flow' });

    // Add expense category nodes and links
    expenseData.data.forEach(item => {
      if (item.amount < 0) {
        const nodeName = item.categoryName || item.category;
        nodes.push({ name: nodeName, category: 'expense' });
        links.push({
          source: 'Total Income',
          target: nodeName,
          value: Math.abs(item.amount),
        });
      }
    });

    // Add savings node if there's net positive income
    const totalIncome = summaryData.income.amount;
    const totalExpenses = summaryData.expenses.amount;
    if (totalIncome > totalExpenses) {
      nodes.push({ name: 'Net Savings', category: 'savings' });
      links.push({
        source: 'Total Income',
        target: 'Net Savings',
        value: totalIncome - totalExpenses,
      });
    }

    return { nodes, links };
  }, [incomeData.data, expenseData.data, summaryData]);

  // Chart configuration with theme support
  const chartOption = useMemo(() => {
    const isDarkTheme =
      theme.pageBackground === '#1F2937' ||
      theme.pageBackground?.includes('dark');

    return {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: isDarkTheme ? '#374151' : '#FFFFFF',
        borderColor: isDarkTheme ? '#6B7280' : '#E5E7EB',
        borderWidth: 1,
        borderRadius: 8,
        textStyle: {
          color: isDarkTheme ? '#F9FAFB' : '#1F2937',
          fontSize: 12,
        },
        padding: [8, 12],
        formatter: function (params: any) {
          if (params.dataType === 'edge') {
            const totalIncome = summaryData.income.amount || 1;
            const percentage = (
              (params.data.value / totalIncome) *
              100
            ).toFixed(1);
            return `
              <div style="font-weight: bold; margin-bottom: 4px;">${params.data.source} → ${params.data.target}</div>
              <div>Amount: ${formatCurrency(params.data.value)}</div>
              <div>Percentage: ${percentage}%</div>
            `;
          } else {
            return `
              <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
              <div>Category: ${params.data?.category || 'N/A'}</div>
            `;
          }
        },
      },
      animation: true,
      animationDuration: 1500,
      animationEasing: 'cubicInOut',
      series: [
        {
          name: 'Income Flow',
          type: 'sankey',
          layout: 'none',
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              opacity: 0.9,
            },
          },
          blur: {
            lineStyle: {
              opacity: 0.1,
            },
            label: {
              opacity: 0.3,
            },
          },
          data: sankeyData.nodes.map(node => ({
            ...node,
            itemStyle: {
              color:
                node.category === 'income' ? '#10B981' :
                node.category === 'flow' ? '#6366F1' :
                node.category === 'savings' ? '#8B5CF6' :
                '#F59E0B',
              borderWidth: 2,
              borderColor: isDarkTheme ? '#374151' : '#FFFFFF',
            }
          })),
          links: sankeyData.links.map((link, index) => ({
            ...link,
            lineStyle: {
              color: 'source',
              opacity: 0.8,
              curveness: 0.5,
              width: Math.max(3, Math.sqrt(link.value / 1000)) // Dynamic width based on value
            },
            emphasis: {
              lineStyle: {
                opacity: 1,
                width: Math.max(5, Math.sqrt(link.value / 800))
              }
            },
            label: {
              show: true,
              position: 'middle',
              formatter: function(params: any) {
                const totalIncome = summaryData.income.amount || 1;
                const percentage = ((params.data.value / totalIncome) * 100).toFixed(1);
                return `${percentage}%`;
              },
              color: isDarkTheme ? '#FFFFFF' : '#1F2937',
              fontSize: 11,
              fontWeight: 'bold',
              backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              padding: [3, 6],
              borderRadius: 4,
              borderWidth: 1,
              borderColor: isDarkTheme ? '#374151' : '#E5E7EB'
            }
          })),
          lineStyle: {
            curveness: 0.5,
          },
          label: {
            position: 'right',
            formatter: '{b}',
            color: theme.pageText,
            fontSize: 11,
          },
          left: '3%',
          right: '3%',
          top: '5%',
          bottom: '8%',
          nodeWidth: 15,
          nodeGap: 12,
          draggable: false,
          focusNodeAdjacency: 'allEdges',
        },
      ],
      toolbox: {
        show: true,
        feature: {
          saveAsImage: {
            show: true,
            title: 'Export as PNG',
            backgroundColor: theme.pageBackground,
            pixelRatio: 2,
            name: 'income-flow-analysis',
          },
          restore: {
            show: true,
            title: 'Reset View',
          },
        },
        right: '3%',
        top: '3%',
        iconStyle: {
          borderColor: theme.pageText,
          color: 'transparent',
        },
        emphasis: {
          iconStyle: {
            borderColor: '#3B82F6',
            color: '#3B82F6',
          },
        },
      },
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
    };
  }, [sankeyData, theme, formatCurrency, summaryData]);

  // Export functionality
  const handleExportChart = useCallback(() => {
    if (chartRef.current) {
      const chartInstance = chartRef.current.getEchartsInstance();
      const dataURL = chartInstance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: theme.pageBackground,
      });

      const link = document.createElement('a');
      link.download = 'income-flow-analysis.png';
      link.href = dataURL;
      link.click();
    }
  }, [theme.pageBackground]);

  const SummaryCard = ({
    amount,
    label,
    color,
    percentage,
    cardId,
  }: {
    amount: number;
    label: string;
    color: string;
    percentage?: string;
    cardId: string;
  }) => (
    <View
      style={{
        backgroundColor: color,
        borderRadius: 12,
        padding: 24,
        minHeight: 120,
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative lines */}
      <View
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 60,
          height: 40,
        }}
      >
        <svg width="60" height="40" viewBox="0 0 60 40">
          <path
            key={`${cardId}-path-1`}
            d="M0,20 Q15,10 30,20 T60,20"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            fill="none"
          />
          <path
            key={`${cardId}-path-2`}
            d="M0,30 Q20,15 40,30 T60,30"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </View>

      <Text
        style={{ color: 'white', fontSize: 14, opacity: 0.9, marginBottom: 8 }}
      >
        {label}
      </Text>
      <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
        {formatCurrency(amount)}
      </Text>
      {percentage && (
        <Text
          style={{ color: 'white', fontSize: 12, opacity: 0.8, marginTop: 4 }}
        >
          {percentage}
        </Text>
      )}
    </View>
  );

  // Loading states
  const isLoading =
    incomeData.isLoading || expenseData.isLoading || accountBalances.isLoading;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.pageBackground,
        padding: 20,
      }}
    >
      {/* Header */}
      <View style={{ marginBottom: 32 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <View
            style={{
              backgroundColor: '#2563EB',
              borderRadius: 6,
              paddingHorizontal: 12,
              paddingVertical: 4,
              marginRight: 12,
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
              {format(new Date(), 'yyyy')}
            </Text>
          </View>
          <Text
            style={{
              color: theme.pageText,
              fontSize: 18,
              fontWeight: 'bold',
            }}
          >
            {t(
              canUseHooks ? 'Financial Dashboard' : 'Financial Dashboard Demo',
            )}
          </Text>
        </View>

        {/* All-time Data Display */}
        <Text
          style={{
            color: theme.pageTextSubdued,
            fontSize: 12,
            marginBottom: 8,
          }}
        >
          {t(
            canUseHooks
              ? 'Showing data from all accounts - All time'
              : 'Showing demo data from all accounts - All time',
          )}
        </Text>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View
          style={{
            padding: 20,
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Text style={{ color: theme.pageText }}>
            {t('Loading financial data...')}
          </Text>
        </View>
      )}

      {/* Summary Cards */}
      <View
        style={{
          flexDirection: 'row',
          gap: 16,
          marginBottom: 32,
          opacity: isLoading ? 0.5 : 1,
        }}
      >
        <SummaryCard
          key="income-card"
          cardId="income"
          amount={summaryData.income.amount}
          label={summaryData.income.label}
          color={summaryData.income.color}
          percentage={summaryData.income.percentage}
        />
        <SummaryCard
          key="expenses-card"
          cardId="expenses"
          amount={summaryData.expenses.amount}
          label={summaryData.expenses.label}
          color={summaryData.expenses.color}
          percentage={summaryData.expenses.percentage}
        />
        <SummaryCard
          key="net-income-card"
          cardId="net-income"
          amount={summaryData.netIncome.amount}
          label={summaryData.netIncome.label}
          color={summaryData.netIncome.color}
          percentage={summaryData.netIncome.percentage}
        />
        <SummaryCard
          key="total-balance-card"
          cardId="total-balance"
          amount={summaryData.totalBalance.amount}
          label={summaryData.totalBalance.label}
          color={summaryData.totalBalance.color}
          percentage={summaryData.totalBalance.percentage}
        />
      </View>

      {/* Sankey Diagram Area */}
      <View
        style={{
          flex: 1,
          backgroundColor: theme.tableBackground,
          borderRadius: 12,
          padding: 20,
          minHeight: 450,
          position: 'relative',
        }}
      >
        {/* Chart Controls */}
        <View
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <Button
            variant="bare"
            onPress={handleExportChart}
            style={{
              padding: 8,
              borderRadius: 6,
              backgroundColor: theme.buttonNormalBackground,
              borderColor: theme.buttonNormalBorder,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: theme.buttonNormalText,
                fontWeight: 'bold',
              }}
            >
              Export PNG
            </Text>
          </Button>
        </View>

        {isLoading ? (
          <View
            style={{
              height: 400,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: theme.pageText }}>
              {t('Loading chart data...')}
            </Text>
          </View>
        ) : sankeyData.nodes.length > 0 ? (
          <ReactECharts
            ref={chartRef}
            option={chartOption}
            style={{
              height: '100%',
              width: '100%',
              minHeight: 400,
            }}
            opts={{
              renderer: 'svg',
              width: 'auto',
              height: 'auto',
            }}
            notMerge={true}
            lazyUpdate={true}
          />
        ) : (
          <View
            style={{
              height: 400,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: theme.pageText, textAlign: 'center' }}>
              {t('No financial data available for the selected period.')}
              <br />
              {t(
                'Try selecting a different date range or check your transactions.',
              )}
            </Text>
          </View>
        )}

        {/* Chart Legend */}
        <View
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            flexDirection: 'row',
            gap: 16,
            backgroundColor: theme.pageBackground,
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.tableBorder,
          }}
        >
          <View
            key="legend-income"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                backgroundColor: '#10B981',
                borderRadius: 2,
              }}
            />
            <Text style={{ fontSize: 11, color: theme.pageText }}>Income</Text>
          </View>
          <View
            key="legend-expenses"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                backgroundColor: '#F59E0B',
                borderRadius: 2,
              }}
            />
            <Text style={{ fontSize: 11, color: theme.pageText }}>
              Expenses
            </Text>
          </View>
          <View
            key="legend-savings"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                backgroundColor: '#8B5CF6',
                borderRadius: 2,
              }}
            />
            <Text style={{ fontSize: 11, color: theme.pageText }}>Savings</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
