import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Settings, Search, AlertCircle, Clock, CheckCircle, Archive, MessageCircle, TrendingUp, TrendingDown } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import type { Ticket, TicketStatus, TicketPriority } from "@/backend/types/ticket";

const FILTERS: { label: string; value: TicketStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Open", value: "open" },
  { label: "Pending", value: "pending" },
  { label: "Solved", value: "solved" },
  { label: "Closed", value: "closed" },
];

const STATUS_COLORS: Record<TicketStatus, string> = {
  new: "#EF4444",
  open: "#3B82F6",
  pending: "#F59E0B",
  solved: "#10B981",
  closed: "#6B7280",
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: "#6B7280",
  normal: "#3B82F6",
  high: "#EF4444",
};

export default function DashboardScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<TicketStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const currentUserId = "agent1";

  const ticketsQuery = trpc.tickets.list.useQuery({
    status: selectedFilter === "all" ? undefined : selectedFilter,
    search: searchQuery,
    assignedToMe: true,
    currentUserId: currentUserId,
  });

  const statsQuery = trpc.tickets.getStats.useQuery();

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderTicket = ({ item }: { item: Ticket }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => router.push(`/ticket/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketTitleRow}>
          <Text style={styles.ticketNumber}>#{item.ticketNumber}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
            {item.priority !== "normal" && (
              <View style={[styles.priorityBadge, { borderColor: PRIORITY_COLORS[item.priority] }]}>
                <Text style={[styles.priorityText, { color: PRIORITY_COLORS[item.priority] }]}>
                  {item.priority.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.timeAgo}>{formatTime(item.updatedAt)}</Text>
      </View>

      <Text style={styles.subject} numberOfLines={2}>
        {item.subject}
      </Text>

      <View style={styles.ticketMeta}>
        <Text style={styles.requester}>{item.requesterName}</Text>
        <Text style={styles.requesterEmail}>{item.requesterEmail}</Text>
      </View>

      <View style={styles.ticketFooter}>
        {item.assignedToName ? (
          <View style={styles.assigneeRow}>
            <View style={styles.assigneeAvatar}>
              <Text style={styles.assigneeInitial}>{item.assignedToName[0]}</Text>
            </View>
            <Text style={styles.assigneeName}>{item.assignedToName}</Text>
          </View>
        ) : (
          <View style={styles.unassignedRow}>
            <Text style={styles.unassignedText}>Unassigned</Text>
          </View>
        )}
        {item.departmentName && (
          <View style={styles.departmentBadge}>
            <Text style={styles.departmentText}>{item.departmentName}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === "web" ? [] : ["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome to KDesk Support System</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/chat")}
            activeOpacity={0.7}
          >
            <MessageCircle size={24} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/settings")}
            activeOpacity={0.7}
          >
            <Settings size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardNew]}>
            <AlertCircle size={20} color="#EF4444" />
            <Text style={styles.statNumber}>{stats.new}</Text>
            <Text style={styles.statLabel}>New</Text>
          </View>
          <View style={[styles.statCard, styles.statCardOpen]}>
            <Clock size={20} color="#3B82F6" />
            <Text style={styles.statNumber}>{stats.open}</Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>
          <View style={[styles.statCard, styles.statCardPending]}>
            <Clock size={20} color="#F59E0B" />
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardSolved]}>
            <CheckCircle size={20} color="#10B981" />
            <Text style={styles.statNumber}>{stats.solved}</Text>
            <Text style={styles.statLabel}>Solved</Text>
          </View>
          <View style={[styles.statCard, styles.statCardClosed]}>
            <Archive size={20} color="#6B7280" />
            <Text style={styles.statNumber}>{stats.closed}</Text>
            <Text style={styles.statLabel}>Closed</Text>
          </View>
          <View style={[styles.statCard, styles.statCardTotal]}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      <View style={styles.dailyReportContainer}>
        <Text style={styles.dailyReportTitle}>7-Day Activity</Text>
        {statsQuery.isLoading ? (
          <ActivityIndicator size="small" color="#3B82F6" style={styles.dailyReportLoader} />
        ) : (
          <View style={styles.dailyReportList}>
            {statsQuery.data?.dailyStats.map((day) => (
              <View key={day.date} style={styles.dailyReportItem}>
                <Text style={styles.dailyReportDate}>{formatDate(day.date)}</Text>
                <View style={styles.dailyReportStats}>
                  <View style={styles.dailyReportStat}>
                    <TrendingUp size={14} color="#10B981" />
                    <Text style={styles.dailyReportStatText}>{day.opened} opened</Text>
                  </View>
                  <View style={styles.dailyReportStat}>
                    <TrendingDown size={14} color="#6B7280" />
                    <Text style={styles.dailyReportStatText}>{day.closed} closed</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets by ID, subject, or email..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === item.value && styles.filterChipActive]}
              onPress={() => setSelectedFilter(item.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {ticketsQuery.isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : ticketsQuery.error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Failed to load tickets</Text>
        </View>
      ) : (
        <FlatList
          data={ticketsQuery.data}
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={styles.ticketsList}
          refreshing={ticketsQuery.isRefetching}
          onRefresh={() => ticketsQuery.refetch()}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No tickets found</Text>
            </View>
          }
        />
      )}


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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  statsContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 4,
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
    borderColor: "#DBEAFE",
    backgroundColor: "#EFF6FF",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  filtersContainer: {
    backgroundColor: "#F9FAFB",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filtersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  filterChipActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  ticketsList: {
    padding: 16,
    gap: 12,
  },
  ticketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  ticketTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ticketNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: "#3B82F6",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1.5,
    backgroundColor: "#FFFFFF",
  },
  priorityText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  timeAgo: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  subject: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    lineHeight: 22,
  },
  ticketMeta: {
    marginBottom: 8,
  },
  requester: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  requesterEmail: {
    fontSize: 13,
    color: "#6B7280",
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  assigneeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unassignedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  unassignedText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  assigneeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  assigneeInitial: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  assigneeName: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  departmentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  departmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  dailyReportContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  dailyReportTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  dailyReportLoader: {
    paddingVertical: 20,
  },
  dailyReportList: {
    gap: 12,
  },
  dailyReportItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  dailyReportDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    minWidth: 80,
  },
  dailyReportStats: {
    flexDirection: "row",
    gap: 16,
  },
  dailyReportStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dailyReportStatText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
});
