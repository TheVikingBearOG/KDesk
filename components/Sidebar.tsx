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
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const currentUserId = "tech1";

  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery(
    { userId: currentUserId },
    { refetchInterval: 5000 }
  );

  const { data: notifications = [] } = trpc.notifications.list.useQuery(
    { userId: currentUserId },
    { enabled: showNotifications }
  );

  const { data: latestNotification } = trpc.notifications.list.useQuery(
    { userId: currentUserId },
    { 
      refetchInterval: 5000,
      select: (data) => data[0]
    }
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
          source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/viv3xwwna0e1id45vv721" }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.topNotificationSection}>
        <View style={styles.latestNotificationPreview}>
          {latestNotification && (
            <Text style={styles.latestNotificationText} numberOfLines={1}>
              {latestNotification.title}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => setShowNotifications(true)}
          activeOpacity={0.7}
        >
          <Bell size={20} color={colors.textSecondary} strokeWidth={2} />
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

        <TouchableOpacity
          style={styles.userProfileButton}
          onPress={() => setShowUserInfo(true)}
          activeOpacity={0.7}
        >
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>AD</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Admin User</Text>
            <Text style={styles.userRole}>Administrator</Text>
          </View>
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

      <Modal
        visible={showUserInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.userInfoPanel}>
            <View style={styles.userInfoHeader}>
              <Text style={styles.userInfoTitle}>User Profile</Text>
              <TouchableOpacity
                onPress={() => setShowUserInfo(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.userInfoContent}>
              <View style={styles.userInfoAvatarContainer}>
                <View style={styles.userInfoAvatar}>
                  <Text style={styles.userInfoAvatarText}>AD</Text>
                </View>
              </View>

              <View style={styles.userInfoField}>
                <Text style={styles.userInfoLabel}>Name</Text>
                <Text style={styles.userInfoValue}>Admin User</Text>
              </View>

              <View style={styles.userInfoField}>
                <Text style={styles.userInfoLabel}>Role</Text>
                <Text style={styles.userInfoValue}>Administrator</Text>
              </View>

              <View style={styles.userInfoField}>
                <Text style={styles.userInfoLabel}>User ID</Text>
                <Text style={styles.userInfoValue}>{currentUserId}</Text>
              </View>

              <View style={styles.userInfoField}>
                <Text style={styles.userInfoLabel}>Email</Text>
                <Text style={styles.userInfoValue}>admin@company.com</Text>
              </View>

              <View style={styles.userInfoField}>
                <Text style={styles.userInfoLabel}>Department</Text>
                <Text style={styles.userInfoValue}>Technical Support</Text>
              </View>
            </View>
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

const createStyles = (colors: any) => StyleSheet.create({
  sidebar: {
    width: 280,
    backgroundColor: colors.cardBackground,
    borderRightWidth: 1,
    borderRightColor: colors.border,
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
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
  },
  logo: {
    width: 256,
    height: 80,
  },
  topNotificationSection: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  latestNotificationPreview: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
  },
  latestNotificationText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
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
    backgroundColor: colors.primaryColor + "20",
  },
  menuText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  menuTextActive: {
    color: colors.primaryColor,
  },
  bottomSection: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  userProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryColor,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  notificationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
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
    backgroundColor: colors.cardBackground,
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
    borderBottomColor: colors.border,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
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
    color: colors.primaryColor,
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
    borderBottomColor: colors.border,
    alignItems: "flex-start",
    gap: 12,
  },
  notificationItemUnread: {
    backgroundColor: colors.primaryColor + "15",
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
    backgroundColor: colors.inputBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  notificationItemMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationItemTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 4,
  },
  userInfoPanel: {
    width: 440,
    backgroundColor: colors.cardBackground,
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
  userInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  userInfoContent: {
    padding: 24,
  },
  userInfoAvatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  userInfoAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryColor,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfoAvatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userInfoField: {
    marginBottom: 20,
  },
  userInfoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  userInfoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
