import React, { useMemo, useCallback, useRef } from 'react';
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

export function Home() {
  const { t } = useTranslation();
  const chartRef = useRef<ReactECharts>(null);



  // Real data hooks
  const accounts = useAccounts();
  const { list: categories } = useCategories();
  const [hideFraction] = useSyncedPref('hideFraction');



  // Currency formatting function - updated to GBP
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(amount / 100); // Convert from cents to pounds
  }, []);

  // Mock data for now - will implement real queries later
  const incomeData = {
    data: [
      { category: 'salary', amount: 350000 }, // £3,500 in pence
      { category: 'freelance', amount: 80000 }, // £800 in pence
      { category: 'investments', amount: 25000 }, // £250 in pence
    ],
    isLoading: false
  };

  const expenseData = {
    data: [
      { category: 'groceries', amount: -45000 }, // £450 in pence
      { category: 'utilities', amount: -18000 }, // £180 in pence
      { category: 'transport', amount: -12000 }, // £120 in pence
      { category: 'entertainment', amount: -8000 }, // £80 in pence
      { category: 'dining', amount: -15000 }, // £150 in pence
    ],
    isLoading: false
  };

  const accountBalances = {
    data: [
      { id: '1', name: 'Current Account', balance: 250000 }, // £2,500
      { id: '2', name: 'Savings Account', balance: 1500000 }, // £15,000
    ],
    isLoading: false
  };

  // Calculate summary data from real budget data
  const summaryData = useMemo(() => {
    const totalIncome = incomeData.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const totalExpenses = Math.abs(expenseData.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0);
    const netIncome = totalIncome - totalExpenses;
    const totalBalance = accountBalances.data?.reduce((sum, account) => sum + (account.balance || 0), 0) || 0;

    return {
      income: { amount: totalIncome, label: 'Income', color: '#10B981' },
      expenses: { amount: totalExpenses, label: 'Expenses', color: '#F59E0B' },
      netIncome: { amount: netIncome, label: 'Net Income', color: '#3B82F6' },
      totalBalance: { amount: totalBalance, label: 'Total Balance', color: '#8B5CF6' },
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

  // Sankey chart data using budget data
  const sankeyData = useMemo(() => {
    if (!incomeData.data || !expenseData.data) {
      return { nodes: [], links: [] };
    }

    const nodes = new Map(); // Use Map to ensure unique names
    const links = [];

    // Income categories - aggregate by category to avoid duplicates
    const incomeByCategory = new Map();
    incomeData.data
      .filter(item => item.amount > 0 && item.category)
      .forEach(item => {
        const existing = incomeByCategory.get(item.category) || 0;
        incomeByCategory.set(item.category, existing + item.amount);
      });

    // Get top 5 income categories
    const topIncomeCategories = Array.from(incomeByCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    topIncomeCategories.forEach(([categoryId, amount]) => {
      const category = activeCategories.find(c => c.id === categoryId);
      if (category && category.name && category.name.trim()) {
        const uniqueName = `${category.name.trim()} (Income)`;
        // Ensure unique name by checking if it already exists
        let finalName = uniqueName;
        let counter = 1;
        while (nodes.has(finalName)) {
          finalName = `${uniqueName} ${counter}`;
          counter++;
        }
        nodes.set(finalName, { name: finalName, category: 'income', id: `income-${categoryId}` });
      }
    });

    // Main flow node
    nodes.set('Total Income', { name: 'Total Income', category: 'flow', id: 'total-income' });

    // Expense categories - aggregate by category to avoid duplicates
    const expenseByCategory = new Map();
    expenseData.data
      .filter(item => item.amount < 0 && item.category)
      .forEach(item => {
        const existing = expenseByCategory.get(item.category) || 0;
        expenseByCategory.set(item.category, existing + item.amount);
      });

    // Get top 10 expense categories
    const topExpenseCategories = Array.from(expenseByCategory.entries())
      .sort((a, b) => a[1] - b[1]) // Most negative first
      .slice(0, 10);

    topExpenseCategories.forEach(([categoryId, amount]) => {
      const category = activeCategories.find(c => c.id === categoryId);
      if (category && category.name && category.name.trim()) {
        const baseName = category.name.trim();
        // Ensure unique name by checking if it already exists
        let uniqueName = baseName;
        let counter = 1;
        while (nodes.has(uniqueName)) {
          uniqueName = `${baseName} ${counter}`;
          counter++;
        }
        nodes.set(uniqueName, { name: uniqueName, category: 'expense', id: `expense-${categoryId}` });
      }
    });

    // Savings node if there's net positive income
    const totalIncome = summaryData.income.amount;
    const totalExpenses = summaryData.expenses.amount;
    if (totalIncome > totalExpenses) {
      nodes.set('Net Savings', { name: 'Net Savings', category: 'savings', id: 'net-savings' });
    }

    // Create links from income categories to total income
    topIncomeCategories.forEach(([categoryId, amount]) => {
      const category = activeCategories.find(c => c.id === categoryId);
      if (category && category.name && category.name.trim()) {
        // Find the actual node name that was created
        const nodeEntry = Array.from(nodes.entries()).find(
          ([name, node]) => node.id === `income-${categoryId}`
        );
        if (nodeEntry) {
          const [nodeName] = nodeEntry;
          links.push({
            source: nodeName,
            target: 'Total Income',
            value: Math.abs(amount),
            id: `link-income-${categoryId}`
          });
        }
      }
    });

    // Create links from total income to expense categories
    topExpenseCategories.forEach(([categoryId, amount]) => {
      const category = activeCategories.find(c => c.id === categoryId);
      if (category && category.name && category.name.trim()) {
        // Find the actual node name that was created
        const nodeEntry = Array.from(nodes.entries()).find(
          ([name, node]) => node.id === `expense-${categoryId}`
        );
        if (nodeEntry) {
          const [nodeName] = nodeEntry;
          links.push({
            source: 'Total Income',
            target: nodeName,
            value: Math.abs(amount),
            id: `link-expense-${categoryId}`
          });
        }
      }
    });

    // Link to savings if positive
    if (totalIncome > totalExpenses) {
      links.push({
        source: 'Total Income',
        target: 'Net Savings',
        value: totalIncome - totalExpenses,
        id: 'savings-link'
      });
    }

    return {
      nodes: Array.from(nodes.values()),
      links: links.filter(link => link.value > 0) // Only include links with positive values
    };
  }, [incomeData.data, expenseData.data, activeCategories, summaryData]);

  // Chart configuration with theme support
  const chartOption = useMemo(() => {
    const isDarkTheme = theme.pageBackground === '#1F2937' || theme.pageBackground?.includes('dark');

    return {
      title: {
        text: 'Income Flow Analysis',
        left: 'center',
        top: '2%',
        textStyle: {
          color: theme.pageText,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: isDarkTheme ? '#374151' : '#FFFFFF',
        borderColor: isDarkTheme ? '#6B7280' : '#E5E7EB',
        borderWidth: 1,
        borderRadius: 8,
        textStyle: {
          color: isDarkTheme ? '#F9FAFB' : '#1F2937',
          fontSize: 12
        },
        padding: [8, 12],
        formatter: function(params: any) {
          if (params.dataType === 'edge') {
            const totalIncome = summaryData.income.amount || 1;
            const percentage = ((params.data.value / totalIncome) * 100).toFixed(1);
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
        }
      },
      animation: true,
      animationDuration: 1500,
      animationEasing: 'cubicInOut',
      series: [
        {
          type: 'sankey',
          layout: 'none',
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              opacity: 0.9
            }
          },
          blur: {
            lineStyle: {
              opacity: 0.1
            },
            label: {
              opacity: 0.3
            }
          },
          data: sankeyData.nodes.map((node, index) => ({
            name: node.name,
            category: node.category,
            id: node.id || `node-${index}`,
            itemStyle: {
              color:
                node.category === 'income' ? '#10B981' :
                node.category === 'flow' ? '#6366F1' :
                node.category === 'savings' ? '#8B5CF6' :
                '#F59E0B',
              borderColor: isDarkTheme ? '#374151' : '#E5E7EB',
              borderWidth: 1
            },
            label: {
              color: theme.pageText,
              fontWeight: 'bold',
              fontSize: 11,
              formatter: function(params: any) {
                return params.name.length > 12 ? params.name.slice(0, 12) + '...' : params.name;
              }
            }
          })),
          links: sankeyData.links.map((link, index) => ({
            ...link,
            id: link.id || `link-${index}`,
            lineStyle: {
              color: 'source',
              opacity: 0.6,
              curveness: 0.5
            },
            emphasis: {
              lineStyle: {
                opacity: 0.8,
                width: 4
              }
            }
          })),
          lineStyle: {
            curveness: 0.5
          },
          label: {
            position: 'right',
            formatter: '{b}',
            color: theme.pageText,
            fontSize: 11
          },
          left: '3%',
          right: '3%',
          top: '12%',
          bottom: '8%',
          nodeWidth: 20,
          nodeGap: 8,
          draggable: false,
          focusNodeAdjacency: 'allEdges'
        }
      ],
      toolbox: {
        show: true,
        feature: {
          saveAsImage: {
            show: true,
            title: 'Export as PNG',
            backgroundColor: theme.pageBackground,
            pixelRatio: 2,
            name: 'income-flow-analysis'
          },
          restore: {
            show: true,
            title: 'Reset View'
          }
        },
        right: '3%',
        top: '3%',
        iconStyle: {
          borderColor: theme.pageText,
          color: 'transparent'
        },
        emphasis: {
          iconStyle: {
            borderColor: '#3B82F6',
            color: '#3B82F6'
          }
        }
      },
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }
    };
  }, [sankeyData, theme, formatCurrency, summaryData]);

  // Export functionality
  const handleExportChart = useCallback(() => {
    if (chartRef.current) {
      const chartInstance = chartRef.current.getEchartsInstance();
      const dataURL = chartInstance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: theme.pageBackground
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
    cardId
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
      
      <Text style={{ color: 'white', fontSize: 14, opacity: 0.9, marginBottom: 8 }}>
        {label}
      </Text>
      <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
        {formatCurrency(amount)}
      </Text>
      {percentage && (
        <Text style={{ color: 'white', fontSize: 12, opacity: 0.8, marginTop: 4 }}>
          {percentage}
        </Text>
      )}
    </View>
  );

  // Loading states
  const isLoading = incomeData.isLoading || expenseData.isLoading || accountBalances.isLoading;

  return (
    <View style={{
      flex: 1,
      backgroundColor: theme.pageBackground,
      padding: 20,
    }}>
      {/* Header */}
      <View style={{ marginBottom: 32 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <View style={{
            backgroundColor: '#2563EB',
            borderRadius: 6,
            paddingHorizontal: 12,
            paddingVertical: 4,
            marginRight: 12,
          }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
              {format(new Date(), 'yyyy')}
            </Text>
          </View>
          <Text style={{
            color: theme.pageText,
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            {t('Financial Dashboard')}
          </Text>
        </View>

        {/* All-time Data Display */}
        <Text style={{
          color: theme.pageTextSubdued,
          fontSize: 12,
          marginBottom: 8
        }}>
          {t('Showing data from all accounts - All time')}
        </Text>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={{
          padding: 20,
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <Text style={{ color: theme.pageText }}>
            {t('Loading financial data...')}
          </Text>
        </View>
      )}

      {/* Summary Cards */}
      <View style={{
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
        opacity: isLoading ? 0.5 : 1,
      }}>
        <SummaryCard
          key="income-card"
          cardId="income"
          amount={summaryData.income.amount}
          label={summaryData.income.label}
          color={summaryData.income.color}
        />
        <SummaryCard
          key="expenses-card"
          cardId="expenses"
          amount={summaryData.expenses.amount}
          label={summaryData.expenses.label}
          color={summaryData.expenses.color}
        />
        <SummaryCard
          key="net-income-card"
          cardId="net-income"
          amount={summaryData.netIncome.amount}
          label={summaryData.netIncome.label}
          color={summaryData.netIncome.color}
          percentage={summaryData.income.amount > 0 ?
            `${(((summaryData.netIncome.amount / summaryData.income.amount) * 100)).toFixed(1)}%` :
            '0%'
          }
        />
        <SummaryCard
          key="total-balance-card"
          cardId="total-balance"
          amount={summaryData.totalBalance.amount}
          label={summaryData.totalBalance.label}
          color={summaryData.totalBalance.color}
        />
      </View>

      {/* Sankey Diagram Area */}
      <View style={{
        flex: 1,
        backgroundColor: theme.tableBackground,
        borderRadius: 12,
        padding: 20,
        minHeight: 450,
        position: 'relative',
      }}>
        {/* Chart Controls */}
        <View style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          flexDirection: 'row',
          gap: 8,
        }}>
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
            <Text style={{
              fontSize: 11,
              color: theme.buttonNormalText,
              fontWeight: 'bold'
            }}>
              Export PNG
            </Text>
          </Button>
        </View>

        {isLoading ? (
          <View style={{
            height: 400,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
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
              minHeight: 400
            }}
            opts={{
              renderer: 'svg',
              width: 'auto',
              height: 'auto'
            }}
            notMerge={true}
            lazyUpdate={true}
          />
        ) : (
          <View style={{
            height: 400,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: theme.pageText, textAlign: 'center' }}>
              {t('No financial data available for the selected period.')}
              <br />
              {t('Try selecting a different date range or check your transactions.')}
            </Text>
          </View>
        )}

        {/* Chart Legend */}
        <View style={{
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
        }}>
          <View key="legend-income" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{
              width: 12,
              height: 12,
              backgroundColor: '#10B981',
              borderRadius: 2,
            }} />
            <Text style={{ fontSize: 11, color: theme.pageText }}>Income</Text>
          </View>
          <View key="legend-expenses" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{
              width: 12,
              height: 12,
              backgroundColor: '#F59E0B',
              borderRadius: 2,
            }} />
            <Text style={{ fontSize: 11, color: theme.pageText }}>Expenses</Text>
          </View>
          <View key="legend-savings" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{
              width: 12,
              height: 12,
              backgroundColor: '#8B5CF6',
              borderRadius: 2,
            }} />
            <Text style={{ fontSize: 11, color: theme.pageText }}>Savings</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
