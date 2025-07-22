import React from 'react';
import { useTranslation } from 'react-i18next';

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
        <View style={{
          flexDirection: 'row',
          height: '100%',
        }}>
          {/* Left side - Income sources */}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={{
              backgroundColor: '#10B981',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
            }}>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                Salary (78.14%)
              </Text>
            </View>
            <View style={{
              backgroundColor: '#059669',
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
            }}>
              <Text style={{ color: 'white', fontSize: 12 }}>
                Bonus (2.77%)
              </Text>
            </View>
            <View style={{
              backgroundColor: '#047857',
              borderRadius: 8,
              padding: 12,
            }}>
              <Text style={{ color: 'white', fontSize: 12 }}>
                Interest Income (3.23%)
              </Text>
            </View>
          </View>

          {/* Center - Flow visualization */}
          <View style={{ 
            flex: 2, 
            justifyContent: 'center', 
            alignItems: 'center',
            position: 'relative',
          }}>
            <View style={{
              backgroundColor: '#1F2937',
              borderRadius: 12,
              padding: 20,
              width: '80%',
            }}>
              <Text style={{ 
                color: 'white', 
                fontSize: 16, 
                fontWeight: 'bold',
                textAlign: 'center' 
              }}>
                Income
              </Text>
            </View>
            
            {/* Flow lines - simplified representation */}
            <svg 
              width="100%" 
              height="200" 
              style={{ position: 'absolute', top: '50%', marginTop: -100 }}
            >
              <defs>
                <linearGradient id="flowGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="flowGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              
              <path
                d="M20,60 Q200,80 380,120"
                stroke="url(#flowGradient1)"
                strokeWidth="20"
                fill="none"
                opacity="0.8"
              />
              <path
                d="M20,100 Q200,100 380,100"
                stroke="url(#flowGradient2)"
                strokeWidth="15"
                fill="none"
                opacity="0.6"
              />
              <path
                d="M20,140 Q200,120 380,80"
                stroke="url(#flowGradient1)"
                strokeWidth="10"
                fill="none"
                opacity="0.4"
              />
            </svg>
          </View>

          {/* Right side - Expense categories */}
          <View style={{ flex: 1, justifyContent: 'space-around' }}>
            <View style={{
              backgroundColor: '#F59E0B',
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
            }}>
              <Text style={{ color: 'white', fontSize: 11 }}>
                Activities (0.19%)
              </Text>
            </View>
            <View style={{
              backgroundColor: '#D97706',
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
            }}>
              <Text style={{ color: 'white', fontSize: 11 }}>
                Gasoline (5.70%)
              </Text>
            </View>
            <View style={{
              backgroundColor: '#B45309',
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
            }}>
              <Text style={{ color: 'white', fontSize: 11 }}>
                Groceries (9.30%)
              </Text>
            </View>
            <View style={{
              backgroundColor: '#92400E',
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
            }}>
              <Text style={{ color: 'white', fontSize: 11 }}>
                Everyday (13.24%)
              </Text>
            </View>
            <View style={{
              backgroundColor: '#78350F',
              borderRadius: 8,
              padding: 12,
            }}>
              <Text style={{ color: 'white', fontSize: 11 }}>
                Bills (9.66%)
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
