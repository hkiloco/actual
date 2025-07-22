import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';

import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { Text } from '@actual-app/components/text';

export function Home() {
  const { t } = useTranslation();

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
        padding: 24,
        minHeight: 400,
      }}>
        <ReactECharts
          option={{
            title: {
              text: 'Income Flow Analysis',
              left: 'center',
              textStyle: {
                color: theme.pageText,
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            tooltip: {
              trigger: 'item',
              triggerOn: 'mousemove',
              backgroundColor: theme.tooltipBackground || '#1F2937',
              borderColor: theme.tooltipBorder || '#374151',
              textStyle: {
                color: theme.tooltipText || '#F9FAFB'
              },
              formatter: function(params: any) {
                if (params.dataType === 'edge') {
                  return `${params.data.source} → ${params.data.target}<br/>Amount: ${formatCurrency(params.data.value)}`;
                } else {
                  return `${params.name}<br/>Total: ${formatCurrency(params.data.value || 0)}`;
                }
              }
            },
            animation: true,
            animationDuration: 1000,
            animationEasing: 'cubicOut',
            series: [
              {
                type: 'sankey',
                layout: 'none',
                emphasis: {
                  focus: 'adjacency'
                },
                data: sankeyData.nodes.map(node => ({
                  name: node.name,
                  itemStyle: {
                    color:
                      node.category === 'income' ? '#10B981' :
                      node.category === 'flow' ? '#6366F1' :
                      node.category === 'savings' ? '#8B5CF6' :
                      '#F59E0B'
                  },
                  label: {
                    color: theme.pageText,
                    fontWeight: 'bold'
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
                      opacity: 0.8
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
                left: '5%',
                right: '5%',
                top: '10%',
                bottom: '10%',
                nodeWidth: 20,
                nodeGap: 12,
                draggable: false
              }
            ],
            toolbox: {
              show: true,
              feature: {
                saveAsImage: {
                  show: true,
                  title: 'Export as PNG',
                  backgroundColor: theme.pageBackground,
                  pixelRatio: 2
                }
              },
              right: '5%',
              top: '5%',
              iconStyle: {
                borderColor: theme.pageText
              }
            },
            backgroundColor: 'transparent'
          }}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </View>
    </View>
  );
}
