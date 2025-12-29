import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import {
  LayoutDashboard,
  Ticket,
  MessageSquare,
  Settings,
  Bell,
  X,
  BarChart3,
} from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useBranding } from "@/contexts/BrandingContext";

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "tickets", label: "Tickets", icon: Ticket, path: "/tickets" },
  { id: "chat", label: "Team Chat", icon: MessageSquare, path: "/chat" },
  { id: "statistics", label: "Statistics", icon: BarChart3, path: "/statistics" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useBranding();
  const [showNotifications, setShowNotifications] = useState(false);
  const currentUserId = "tech1";

  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery(
    { userId: currentUserId },
    { refetchInterval: 5000 }
  );

  const { data: notifications = [] } = trpc.notifications.list.useQuery(
    { userId: currentUserId },
    { enabled: showNotifications }
  );

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation();
  const deleteMutation = trpc.notifications.delete.useMutation();

  const utils = trpc.useUtils();

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsReadMutation.mutateAsync({ id: notificationId });
    utils.notifications.list.invalidate();
    utils.notifications.getUnreadCount.invalidate();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync({ userId: currentUserId });
    utils.notifications.list.invalidate();
    utils.notifications.getUnreadCount.invalidate();
  };

  const handleDelete = async (notificationId: string) => {
    await deleteMutation.mutateAsync({ id: notificationId });
    utils.notifications.list.invalidate();
    utils.notifications.getUnreadCount.invalidate();
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.ticketId) {
      router.push(`/ticket/${notification.ticketId}` as any);
      setShowNotifications(false);
    } else if (notification.channelId) {
      router.push("/chat" as any);
      setShowNotifications(false);
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path as any);
  };

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.logoSection}>
        <Image
          source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/a814ck7a5ovt90dlls5yd" }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AD</Text>
        </View>
        <Text style={styles.profileName}>Admin User</Text>
        <Text style={styles.profileRole}>Administrator</Text>
        
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => setShowNotifications(true)}
          activeOpacity={0.7}
        >
          <Bell size={20} color="#6B7280" strokeWidth={2} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, active && styles.menuItemActive]}
              onPress={() => handleNavigate(item.path)}
              activeOpacity={0.7}
            >
              <Icon
                size={20}
                color={active ? colors.primaryColor : "#6B7280"}
                strokeWidth={2}
              />
              <Text style={[styles.menuText, active && styles.menuTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.menuItem,
            isActive("/settings") && styles.menuItemActive,
          ]}
          onPress={() => handleNavigate("/settings")}
          activeOpacity={0.7}
        >
          <Settings
            size={20}
            color={isActive("/settings") ? colors.primaryColor : "#6B7280"}
            strokeWidth={2}
          />
          <Text
            style={[
              styles.menuText,
              isActive("/settings") && styles.menuTextActive,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationPanel}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>Notifications</Text>
              <View style={styles.notificationHeaderActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={handleMarkAllAsRead}
                    style={styles.markAllButton}
                  >
                    <Text style={styles.markAllButtonText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setShowNotifications(false)}
                  style={styles.closeButton}
                >
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.notificationList}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Bell size={48} color="#D1D5DB" strokeWidth={1.5} />
                  <Text style={styles.emptyStateText}>No notifications</Text>
                </View>
              ) : (
                notifications.map((notification: any) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.read && styles.notificationItemUnread,
                    ]}
                    onPress={() => handleNotificationClick(notification)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationIconContainer}>
                        {notification.type === "ticket_assigned" ? (
                          <Ticket size={18} color="#3B82F6" strokeWidth={2} />
                        ) : (
                          <MessageSquare size={18} color="#10B981" strokeWidth={2} />
                        )}
                      </View>
                      <View style={styles.notificationTextContainer}>
                        <Text style={styles.notificationItemTitle}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notificationItemMessage}>
                          {notification.message}
                        </Text>
                        <Text style={styles.notificationItemTime}>
                          {formatNotificationTime(notification.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      style={styles.deleteButton}
                    >
                      <X size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatNotificationTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return time.toLocaleDateString();
}

const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    height: "100%",
    ...Platform.select({
      web: {
        position: "fixed" as any,
        left: 0,
        top: 0,
        bottom: 0,
      },
    }),
  },
  logoSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
  },
  logo: {
    width: 220,
    height: 80,
  },
  profileSection: {
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  menuSection: {
    flex: 1,
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: "#EFF6FF",
  },
  menuText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  menuTextActive: {
    color: "#3B82F6",
  },
  bottomSection: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  notificationButton: {
    position: "absolute" as const,
    top: 20,
    right: 20,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  notificationBadge: {
    position: "absolute" as const,
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationPanel: {
    width: 480,
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" as any,
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  notificationHeaderActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
  },
  closeButton: {
    padding: 4,
  },
  notificationList: {
    maxHeight: 500,
  },
  emptyState: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 15,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "flex-start",
    gap: 12,
  },
  notificationItemUnread: {
    backgroundColor: "#F0F9FF",
  },
  notificationContent: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  notificationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  notificationItemMessage: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationItemTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  deleteButton: {
    padding: 4,
  },
});
