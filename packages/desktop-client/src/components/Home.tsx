import React, { useMemo, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import { subMonths, format, parseISO } from 'date-fns';

import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { Text } from '@actual-app/components/text';
import { Button } from '@actual-app/components/button';
import { Select } from '@actual-app/components/select';
import { SvgCalendar3 } from '@actual-app/components/icons/v2';

import * as monthUtils from 'loot-core/shared/months';
import { q } from 'loot-core/shared/query';
import { type AccountEntity } from 'loot-core/types/models';

import { useAccounts } from '@desktop-client/hooks/useAccounts';
import { useCategories } from '@desktop-client/hooks/useCategories';
import { useSpreadsheet } from '@desktop-client/hooks/useSpreadsheet';
import { useSyncedPref } from '@desktop-client/hooks/useSyncedPref';
import { useQuery } from '@desktop-client/hooks/useQuery';

export function Home() {
  const { t } = useTranslation();
  const chartRef = useRef<ReactECharts>(null);

  // Date filtering state
  const [selectedDateRange, setSelectedDateRange] = useState('Last 6 months');

  // Real data hooks
  const accounts = useAccounts();
  const { list: categories } = useCategories();
  const spreadsheet = useSpreadsheet();
  const [hideFraction] = useSyncedPref('hideFraction');

  // Date range options
  const dateRangeOptions = [
    { value: 'This month', label: t('This month') },
    { value: 'Last month', label: t('Last month') },
    { value: 'Last 3 months', label: t('Last 3 months') },
    { value: 'Last 6 months', label: t('Last 6 months') },
    { value: 'Last 12 months', label: t('Last 12 months') },
    { value: 'This year', label: t('This year') },
    { value: 'Last year', label: t('Last year') },
  ];

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    const today = new Date();
    const currentMonth = monthUtils.currentMonth();

    switch (selectedDateRange) {
      case 'This month':
        return {
          start: monthUtils.firstDayOfMonth(currentMonth),
          end: monthUtils.lastDayOfMonth(currentMonth)
        };
      case 'Last month':
        const lastMonth = monthUtils.subMonths(currentMonth, 1);
        return {
          start: monthUtils.firstDayOfMonth(lastMonth),
          end: monthUtils.lastDayOfMonth(lastMonth)
        };
      case 'Last 3 months':
        return {
          start: monthUtils.firstDayOfMonth(monthUtils.subMonths(currentMonth, 2)),
          end: monthUtils.lastDayOfMonth(currentMonth)
        };
      case 'Last 6 months':
        return {
          start: monthUtils.firstDayOfMonth(monthUtils.subMonths(currentMonth, 5)),
          end: monthUtils.lastDayOfMonth(currentMonth)
        };
      case 'Last 12 months':
        return {
          start: monthUtils.firstDayOfMonth(monthUtils.subMonths(currentMonth, 11)),
          end: monthUtils.lastDayOfMonth(currentMonth)
        };
      case 'This year':
        return {
          start: `${today.getFullYear()}-01-01`,
          end: monthUtils.currentDay()
        };
      case 'Last year':
        return {
          start: `${today.getFullYear() - 1}-01-01`,
          end: `${today.getFullYear() - 1}-12-31`
        };
      default:
        return {
          start: monthUtils.firstDayOfMonth(monthUtils.subMonths(currentMonth, 5)),
          end: monthUtils.lastDayOfMonth(currentMonth)
        };
    }
  }, [selectedDateRange]);

  // Currency formatting function - updated to GBP
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(amount / 100); // Convert from cents to pounds
  }, []);

  // Real budget data queries
  const incomeData = useQuery(
    () => {
      return q('transactions')
        .filter({
          date: { $gte: dateRange.start, $lte: dateRange.end },
          amount: { $gt: 0 },
        })
        .groupBy('category')
        .select(['category', { amount: { $sum: '$amount' } }])
        .options({ splits: 'all' });
    },
    [dateRange]
  );

  const expenseData = useQuery(
    () => {
      return q('transactions')
        .filter({
          date: { $gte: dateRange.start, $lte: dateRange.end },
          amount: { $lt: 0 },
        })
        .groupBy('category')
        .select(['category', { amount: { $sum: '$amount' } }])
        .options({ splits: 'all' });
    },
    [dateRange]
  );

  const accountBalances = useQuery(
    () => {
      return q('accounts')
        .filter({ closed: false })
        .select(['id', 'name', 'balance']);
    },
    []
  );

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

  // Sankey chart data using real budget data
  const sankeyData = useMemo(() => {
    if (!incomeData.data || !expenseData.data || !categories.length) {
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
      const category = categories.find(c => c.id === categoryId);
      if (category && category.name) {
        const uniqueName = `${category.name} (Income)`;
        nodes.set(uniqueName, { name: uniqueName, category: 'income', id: categoryId });
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
      const category = categories.find(c => c.id === categoryId);
      if (category && category.name) {
        const uniqueName = category.name;
        nodes.set(uniqueName, { name: uniqueName, category: 'expense', id: categoryId });
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
      const category = categories.find(c => c.id === categoryId);
      if (category && category.name) {
        const sourceName = `${category.name} (Income)`;
        links.push({
          source: sourceName,
          target: 'Total Income',
          value: Math.abs(amount),
          id: `income-${categoryId}`
        });
      }
    });

    // Create links from total income to expense categories
    topExpenseCategories.forEach(([categoryId, amount]) => {
      const category = categories.find(c => c.id === categoryId);
      if (category && category.name) {
        links.push({
          source: 'Total Income',
          target: category.name,
          value: Math.abs(amount),
          id: `expense-${categoryId}`
        });
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
  }, [incomeData.data, expenseData.data, categories, summaryData]);

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
    percentage 
  }: { 
    amount: number; 
    label: string; 
    color: string; 
    percentage?: string; 
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
            d="M0,20 Q15,10 30,20 T60,20"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            fill="none"
          />
          <path
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
      {/* Header with Date Filter */}
      <View style={{ marginBottom: 32 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
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

          {/* Date Range Filter */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}>
            <SvgCalendar3 style={{
              width: 16,
              height: 16,
              color: theme.pageText
            }} />
            <Select
              value={selectedDateRange}
              onChange={setSelectedDateRange}
              options={dateRangeOptions}
              style={{
                minWidth: 160,
                fontSize: 14,
              }}
            />
          </View>
        </View>

        {/* Date Range Display */}
        <Text style={{
          color: theme.pageTextSubdued,
          fontSize: 12,
          marginBottom: 8
        }}>
          {t('Period')}: {dateRange.start} {t('to')} {dateRange.end}
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
          amount={summaryData.income.amount}
          label={summaryData.income.label}
          color={summaryData.income.color}
        />
        <SummaryCard
          amount={summaryData.expenses.amount}
          label={summaryData.expenses.label}
          color={summaryData.expenses.color}
        />
        <SummaryCard
          amount={summaryData.netIncome.amount}
          label={summaryData.netIncome.label}
          color={summaryData.netIncome.color}
          percentage={summaryData.income.amount > 0 ?
            `${(((summaryData.netIncome.amount / summaryData.income.amount) * 100)).toFixed(1)}%` :
            '0%'
          }
        />
        <SummaryCard
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{
              width: 12,
              height: 12,
              backgroundColor: '#10B981',
              borderRadius: 2,
            }} />
            <Text style={{ fontSize: 11, color: theme.pageText }}>Income</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{
              width: 12,
              height: 12,
              backgroundColor: '#F59E0B',
              borderRadius: 2,
            }} />
            <Text style={{ fontSize: 11, color: theme.pageText }}>Expenses</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
