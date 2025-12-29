import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertCircle, Clock, CheckCircle, Archive, TrendingUp, TrendingDown } from "lucide-react-native";
import { trpc } from "@/lib/trpc";

type DateRange = 7 | 14 | 30;

export default function StatisticsScreen() {
  const [selectedRange, setSelectedRange] = useState<DateRange>(7);

  const statsQuery = trpc.tickets.getStats.useQuery();

  const filteredStats = useMemo(() => {
    if (!statsQuery.data?.dailyStats) return [];
    return statsQuery.data.dailyStats.slice(-selectedRange);
  }, [statsQuery.data, selectedRange]);

  const totalOpened = useMemo(() => {
    return filteredStats.reduce((sum, day) => sum + day.opened, 0);
  }, [filteredStats]);

  const totalClosedInRange = useMemo(() => {
    return filteredStats.reduce((sum, day) => sum + day.closed, 0);
  }, [filteredStats]);

  const stats = useMemo(() => {
    if (!statsQuery.data) {
      return {
        new: 0,
        open: 0,
        pending: 0,
        solved: 0,
        closed: 0,
        total: 0,
      };
    }
    return {
      new: statsQuery.data.totalNew,
      open: statsQuery.data.totalOpen,
      pending: statsQuery.data.totalPending,
      solved: statsQuery.data.totalSolved,
      closed: statsQuery.data.totalClosed,
      total: statsQuery.data.totalTickets,
    };
  }, [statsQuery.data]);

  const maxValue = useMemo(() => {
    const values = filteredStats.flatMap(day => [day.opened, day.closed]);
    return Math.max(...values, 1);
  }, [filteredStats]);

  if (statsQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={Platform.OS === "web" ? [] : ["top"]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === "web" ? [] : ["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Statistics</Text>
          <Text style={styles.headerSubtitle}>Admin Analytics Dashboard</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Status</Text>
          <View style={styles.currentStatsGrid}>
            <View style={[styles.currentStatCard, styles.statCardNew]}>
              <View style={styles.statIconContainer}>
                <AlertCircle size={24} color="#EF4444" strokeWidth={2.5} />
              </View>
              <Text style={styles.currentStatNumber}>{stats.new}</Text>
              <Text style={styles.currentStatLabel}>New</Text>
            </View>

            <View style={[styles.currentStatCard, styles.statCardOpen]}>
              <View style={styles.statIconContainer}>
                <Clock size={24} color="#3B82F6" strokeWidth={2.5} />
              </View>
              <Text style={styles.currentStatNumber}>{stats.open}</Text>
              <Text style={styles.currentStatLabel}>Open</Text>
            </View>

            <View style={[styles.currentStatCard, styles.statCardPending]}>
              <View style={styles.statIconContainer}>
                <Clock size={24} color="#F59E0B" strokeWidth={2.5} />
              </View>
              <Text style={styles.currentStatNumber}>{stats.pending}</Text>
              <Text style={styles.currentStatLabel}>Pending</Text>
            </View>

            <View style={[styles.currentStatCard, styles.statCardSolved]}>
              <View style={styles.statIconContainer}>
                <CheckCircle size={24} color="#10B981" strokeWidth={2.5} />
              </View>
              <Text style={styles.currentStatNumber}>{stats.solved}</Text>
              <Text style={styles.currentStatLabel}>Solved</Text>
            </View>

            <View style={[styles.currentStatCard, styles.statCardClosed]}>
              <View style={styles.statIconContainer}>
                <Archive size={24} color="#6B7280" strokeWidth={2.5} />
              </View>
              <Text style={styles.currentStatNumber}>{stats.closed}</Text>
              <Text style={styles.currentStatLabel}>Closed</Text>
            </View>

            <View style={[styles.currentStatCard, styles.statCardTotal]}>
              <View style={styles.statIconContainer}>
                <Text style={styles.totalIcon}>∑</Text>
              </View>
              <Text style={styles.currentStatNumber}>{stats.total}</Text>
              <Text style={styles.currentStatLabel}>Total</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activity Report</Text>
            <View style={styles.rangeSelector}>
              <TouchableOpacity
                style={[styles.rangeButton, selectedRange === 7 && styles.rangeButtonActive]}
                onPress={() => setSelectedRange(7)}
                activeOpacity={0.7}
              >
                <Text style={[styles.rangeButtonText, selectedRange === 7 && styles.rangeButtonTextActive]}>
                  7 days
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rangeButton, selectedRange === 14 && styles.rangeButtonActive]}
                onPress={() => setSelectedRange(14)}
                activeOpacity={0.7}
              >
                <Text style={[styles.rangeButtonText, selectedRange === 14 && styles.rangeButtonTextActive]}>
                  14 days
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rangeButton, selectedRange === 30 && styles.rangeButtonActive]}
                onPress={() => setSelectedRange(30)}
                activeOpacity={0.7}
              >
                <Text style={[styles.rangeButtonText, selectedRange === 30 && styles.rangeButtonTextActive]}>
                  30 days
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <TrendingUp size={20} color="#3B82F6" strokeWidth={2.5} />
                <Text style={styles.summaryCardLabel}>Opened</Text>
              </View>
              <Text style={styles.summaryCardNumber}>{totalOpened}</Text>
              <Text style={styles.summaryCardSubtext}>Last {selectedRange} days</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <TrendingDown size={20} color="#10B981" strokeWidth={2.5} />
                <Text style={styles.summaryCardLabel}>Closed</Text>
              </View>
              <Text style={styles.summaryCardNumber}>{totalClosedInRange}</Text>
              <Text style={styles.summaryCardSubtext}>Last {selectedRange} days</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Daily Activity</Text>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#3B82F6" }]} />
                  <Text style={styles.legendText}>Opened</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
                  <Text style={styles.legendText}>Closed</Text>
                </View>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
              <View style={styles.chart}>
                {filteredStats.map((day, index) => {
                  const date = new Date(day.date);
                  const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
                  const dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                  return (
                    <View key={day.date} style={styles.chartColumn}>
                      <View style={styles.chartBars}>
                        <View style={styles.barPair}>
                          <View
                            style={[
                              styles.bar,
                              styles.barOpened,
                              { height: (day.opened / maxValue) * 120 || 2 },
                            ]}
                          >
                            {day.opened > 0 && (
                              <Text style={styles.barLabel}>{day.opened}</Text>
                            )}
                          </View>
                          <View
                            style={[
                              styles.bar,
                              styles.barClosed,
                              { height: (day.closed / maxValue) * 120 || 2 },
                            ]}
                          >
                            {day.closed > 0 && (
                              <Text style={styles.barLabel}>{day.closed}</Text>
                            )}
                          </View>
                        </View>
                      </View>
                      <View style={styles.chartLabels}>
                        <Text style={styles.chartDayLabel}>{dayLabel}</Text>
                        <Text style={styles.chartDateLabel}>{dateLabel}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resolution Rate</Text>
          <View style={styles.resolutionCard}>
            <View style={styles.resolutionRow}>
              <Text style={styles.resolutionLabel}>Active Tickets</Text>
              <Text style={styles.resolutionValue}>{stats.new + stats.open + stats.pending}</Text>
            </View>
            <View style={styles.resolutionRow}>
              <Text style={styles.resolutionLabel}>Resolved Tickets</Text>
              <Text style={styles.resolutionValue}>{stats.solved + stats.closed}</Text>
            </View>
            <View style={styles.resolutionDivider} />
            <View style={styles.resolutionRow}>
              <Text style={styles.resolutionLabelBold}>Resolution Rate</Text>
              <Text style={styles.resolutionValueBold}>
                {stats.total > 0
                  ? Math.round(((stats.solved + stats.closed) / stats.total) * 100)
                  : 0}
                %
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  currentStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  currentStatCard: {
    width: "31.5%",
    minWidth: 100,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  statCardNew: {
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
  },
  statCardOpen: {
    borderColor: "#DBEAFE",
    backgroundColor: "#EFF6FF",
  },
  statCardPending: {
    borderColor: "#FEF3C7",
    backgroundColor: "#FFFBEB",
  },
  statCardSolved: {
    borderColor: "#D1FAE5",
    backgroundColor: "#F0FDF4",
  },
  statCardClosed: {
    borderColor: "#F3F4F6",
    backgroundColor: "#F9FAFB",
  },
  statCardTotal: {
    borderColor: "#E0E7FF",
    backgroundColor: "#EEF2FF",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  totalIcon: {
    fontSize: 24,
    fontWeight: "700",
    color: "#6366F1",
  },
  currentStatNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
  },
  currentStatLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rangeSelector: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  rangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  rangeButtonActive: {
    backgroundColor: "#3B82F6",
  },
  rangeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  rangeButtonTextActive: {
    color: "#FFFFFF",
  },
  summaryCards: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  summaryCardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  summaryCardNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  summaryCardSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  chartContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  chartLegend: {
    flexDirection: "row",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  chartScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 20,
    paddingVertical: 10,
  },
  chartColumn: {
    alignItems: "center",
    gap: 8,
  },
  chartBars: {
    height: 140,
    justifyContent: "flex-end",
  },
  barPair: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  bar: {
    width: 24,
    borderRadius: 6,
    minHeight: 2,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 4,
  },
  barOpened: {
    backgroundColor: "#3B82F6",
  },
  barClosed: {
    backgroundColor: "#10B981",
  },
  barLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  chartLabels: {
    alignItems: "center",
    gap: 2,
  },
  chartDayLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  chartDateLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  resolutionCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  resolutionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  resolutionLabel: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  resolutionValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },
  resolutionLabelBold: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "700",
  },
  resolutionValueBold: {
    fontSize: 20,
    color: "#3B82F6",
    fontWeight: "800",
  },
  resolutionDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
});
