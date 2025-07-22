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

  // Mock data - in a real implementation, this would come from your data hooks
  const summaryData = {
    income: { amount: 108660, label: 'Income', color: '#10B981' },
    expenses: { amount: 66783, label: 'Expenses', color: '#F59E0B' },
    endingBalance: { amount: 41817, label: 'Ending Balance', color: '#3B82F6' },
    remainingBalance: { amount: 47605, label: 'Remaining Balance until 2026', color: '#8B5CF6' },
  };

  // Sankey chart data
  const sankeyData = useMemo(() => {
    return {
      nodes: [
        // Income sources
        { name: 'Salary', category: 'income' },
        { name: 'Bonus', category: 'income' },
        { name: 'Interest Income', category: 'income' },

        // Main income flow
        { name: 'Total Income', category: 'flow' },

        // Expense categories
        { name: 'Everyday', category: 'expense' },
        { name: 'Groceries', category: 'expense' },
        { name: 'Bills', category: 'expense' },
        { name: 'Gasoline', category: 'expense' },
        { name: 'Activities', category: 'expense' },
        { name: 'Insurance', category: 'expense' },
        { name: 'Transportation', category: 'expense' },
        { name: 'Travel', category: 'expense' },
        { name: 'Utilities', category: 'expense' },
        { name: 'Health', category: 'expense' },
        { name: 'Housing', category: 'expense' },
        { name: 'Entertainment', category: 'expense' },

        // Savings/Investment
        { name: 'Savings', category: 'savings' },
      ],
      links: [
        // Income to Total Income
        { source: 'Salary', target: 'Total Income', value: 84896 },
        { source: 'Bonus', target: 'Total Income', value: 3010 },
        { source: 'Interest Income', target: 'Total Income', value: 3507 },

        // Total Income to expenses
        { source: 'Total Income', target: 'Everyday', value: 14395 },
        { source: 'Total Income', target: 'Groceries', value: 10117 },
        { source: 'Total Income', target: 'Bills', value: 10488 },
        { source: 'Total Income', target: 'Gasoline', value: 6198 },
        { source: 'Total Income', target: 'Activities', value: 207 },
        { source: 'Total Income', target: 'Insurance', value: 3750 },
        { source: 'Total Income', target: 'Transportation', value: 2795 },
        { source: 'Total Income', target: 'Travel', value: 2314 },
        { source: 'Total Income', target: 'Utilities', value: 4834 },
        { source: 'Total Income', target: 'Health', value: 2934 },
        { source: 'Total Income', target: 'Housing', value: 1806 },
        { source: 'Total Income', target: 'Entertainment', value: 1935 },

        // Remaining to savings
        { source: 'Total Income', target: 'Savings', value: 41877 },
      ]
    };
  }, []);

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
            const percentage = ((params.data.value / 108660) * 100).toFixed(1);
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
          data: sankeyData.nodes.map(node => ({
            name: node.name,
            category: node.category,
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
          links: sankeyData.links.map(link => ({
            ...link,
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
  }, [sankeyData, theme, formatCurrency]);

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

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: theme.pageBackground,
      padding: 20,
    }}>
      <View style={{ marginBottom: 32 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <View style={{
            backgroundColor: '#2563EB',
            borderRadius: 6,
            paddingHorizontal: 12,
            paddingVertical: 4,
            marginRight: 12,
          }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
              2025
            </Text>
          </View>
          <Text style={{ 
            color: theme.pageText, 
            fontSize: 18, 
            fontWeight: 'bold' 
          }}>
            Annual budget for 2025
          </Text>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={{
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
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
          amount={summaryData.endingBalance.amount}
          label={summaryData.endingBalance.label}
          color={summaryData.endingBalance.color}
          percentage="-39%"
        />
        <SummaryCard
          amount={summaryData.remainingBalance.amount}
          label={summaryData.remainingBalance.label}
          color={summaryData.remainingBalance.color}
          percentage="-31%"
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
