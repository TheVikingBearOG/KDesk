import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Modal,
  Linking,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Send, StickyNote, UserCircle, Building2, X, Briefcase, ExternalLink } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import type { Message, TicketStatus } from "@/backend/types/ticket";

const STATUS_OPTIONS: TicketStatus[] = ["new", "open", "pending", "solved", "closed"];

const STATUS_COLORS: Record<TicketStatus, string> = {
  new: "#EF4444",
  open: "#3B82F6",
  pending: "#F59E0B",
  solved: "#10B981",
  closed: "#6B7280",
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignType, setAssignType] = useState<"technician" | "department">("technician");
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [workOrderInput, setWorkOrderInput] = useState("");
  const currentUserId = "tech1";

  const utils = trpc.useUtils();
  const ticketQuery = trpc.tickets.get.useQuery({ id: id as string });
  const techniciansQuery = trpc.settings.listTechnicians.useQuery();
  const departmentsQuery = trpc.settings.listDepartments.useQuery();
  
  const updateStatusMutation = trpc.tickets.updateStatus.useMutation({
    onSuccess: () => {
      utils.tickets.get.invalidate({ id: id as string });
      utils.tickets.list.invalidate();
    },
  });

  const assignToTechnicianMutation = trpc.tickets.assignToTechnician.useMutation({
    onSuccess: () => {
      setShowAssignModal(false);
      utils.tickets.get.invalidate({ id: id as string });
      utils.tickets.list.invalidate();
    },
  });

  const assignToDepartmentMutation = trpc.tickets.assignToDepartment.useMutation({
    onSuccess: () => {
      setShowAssignModal(false);
      utils.tickets.get.invalidate({ id: id as string });
      utils.tickets.list.invalidate();
    },
  });

  const updateWorkOrderMutation = trpc.tickets.updateWorkOrder.useMutation({
    onSuccess: () => {
      setShowWorkOrderModal(false);
      setWorkOrderInput("");
      utils.tickets.get.invalidate({ id: id as string });
      utils.tickets.list.invalidate();
    },
  });

  const addReplyMutation = trpc.tickets.addReply.useMutation({
    onSuccess: () => {
      setReplyText("");
      setIsInternalNote(false);
      utils.tickets.get.invalidate({ id: id as string });
      utils.tickets.list.invalidate();
    },
  });

  const handleStatusChange = (status: TicketStatus) => {
    updateStatusMutation.mutate({ id: id as string, status });
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    addReplyMutation.mutate({
      ticketId: id as string,
      body: replyText.trim(),
      isInternal: isInternalNote,
      userId: currentUserId,
    });
  };

  const handleAssignTechnician = (technicianId?: string, technicianName?: string) => {
    assignToTechnicianMutation.mutate({
      ticketId: id as string,
      technicianId,
      technicianName,
    });
  };

  const handleAssignDepartment = (departmentId?: string, departmentName?: string) => {
    assignToDepartmentMutation.mutate({
      ticketId: id as string,
      departmentId,
      departmentName,
    });
  };

  const handleUpdateWorkOrder = () => {
    updateWorkOrderMutation.mutate({
      ticketId: id as string,
      workOrderId: workOrderInput.trim() || undefined,
    });
  };

  const openWorkOrder = async () => {
    if (ticket?.workOrderId) {
      const url = `https://verk.kd.is/works/${ticket.workOrderId}`;
      if (Platform.OS === "web") {
        window.open(url, "_blank");
      } else {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          console.log("Cannot open URL:", url);
        }
      }
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = (message: Message) => {
    const isInternal = message.isInternal;
    const isInbound = message.type === "inbound";

    return (
      <View
        key={message.id}
        style={[
          styles.messageCard,
          isInternal && styles.messageCardInternal,
          isInbound && styles.messageCardInbound,
        ]}
      >
        <View style={styles.messageHeader}>
          <View style={styles.messageHeaderLeft}>
            <View
              style={[
                styles.messageAvatar,
                isInbound ? styles.avatarCustomer : styles.avatarAgent,
              ]}
            >
              <Text style={styles.avatarText}>
                {isInbound
                  ? ticketQuery.data?.requesterName[0] || "?"
                  : "A"}
              </Text>
            </View>
            <View>
              <Text style={styles.messageSender}>
                {isInbound ? ticketQuery.data?.requesterName : "Support Team"}
              </Text>
              <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
            </View>
          </View>
          {isInternal && (
            <View style={styles.internalBadge}>
              <StickyNote size={12} color="#F59E0B" />
              <Text style={styles.internalBadgeText}>Internal</Text>
            </View>
          )}
        </View>
        <Text style={styles.messageBody}>{message.bodyText}</Text>
      </View>
    );
  };

  if (ticketQuery.isLoading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (ticketQuery.error || !ticketQuery.data) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>Failed to load ticket</Text>
      </View>
    );
  }

  const ticket = ticketQuery.data;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.ticketHeader}>
          <View style={styles.ticketHeaderTop}>
            <Text style={styles.ticketNumber}>#{ticket.ticketNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[ticket.status] }]}>
              <Text style={styles.statusText}>{ticket.status.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.subject}>{ticket.subject}</Text>
          <View style={styles.requesterInfo}>
            <Text style={styles.requesterName}>{ticket.requesterName}</Text>
            <Text style={styles.requesterEmail}>{ticket.requesterEmail}</Text>
          </View>
        </View>

        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Change Status</Text>
          <View style={styles.statusButtons}>
            {STATUS_OPTIONS.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  ticket.status === status && styles.statusButtonActive,
                  { borderColor: STATUS_COLORS[status] },
                ]}
                onPress={() => handleStatusChange(status)}
                disabled={updateStatusMutation.isPending}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    ticket.status === status && { color: STATUS_COLORS[status] },
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.assignSection}>
          <Text style={styles.sectionTitle}>Assignment</Text>
          
          <View style={styles.assignmentCard}>
            <View style={styles.assignmentRow}>
              <View style={styles.assignmentLabel}>
                <UserCircle size={16} color="#6B7280" />
                <Text style={styles.assignmentLabelText}>Technician</Text>
              </View>
              <TouchableOpacity
                style={styles.assignmentValue}
                onPress={() => {
                  setAssignType("technician");
                  setShowAssignModal(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.assignmentValueText}>
                  {ticket.assignedToName || "Unassigned"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.assignmentRow}>
              <View style={styles.assignmentLabel}>
                <Building2 size={16} color="#6B7280" />
                <Text style={styles.assignmentLabelText}>Department</Text>
              </View>
              <TouchableOpacity
                style={styles.assignmentValue}
                onPress={() => {
                  setAssignType("department");
                  setShowAssignModal(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.assignmentValueText}>
                  {ticket.departmentName || "Unassigned"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.workOrderSection}>
          <Text style={styles.sectionTitle}>Work Order</Text>
          <View style={styles.workOrderCard}>
            <View style={styles.workOrderRow}>
              <View style={styles.assignmentLabel}>
                <Briefcase size={16} color="#6B7280" />
                <Text style={styles.assignmentLabelText}>Work Order ID</Text>
              </View>
              {ticket.workOrderId ? (
                <View style={styles.workOrderActions}>
                  <TouchableOpacity
                    style={styles.workOrderLink}
                    onPress={openWorkOrder}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.workOrderLinkText}>#{ticket.workOrderId}</Text>
                    <ExternalLink size={14} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.workOrderEditButton}
                    onPress={() => {
                      setWorkOrderInput(ticket.workOrderId || "");
                      setShowWorkOrderModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.workOrderEditText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.assignmentValue}
                  onPress={() => {
                    setWorkOrderInput("");
                    setShowWorkOrderModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.assignmentValueText}>Not Set</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.messagesSection}>
          <Text style={styles.sectionTitle}>Conversation</Text>
          {ticket.messages.map((message) => renderMessage(message))}
        </View>
      </ScrollView>

      <View style={styles.replySection}>
        <View style={styles.replyTypeToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, !isInternalNote && styles.toggleButtonActive]}
            onPress={() => setIsInternalNote(false)}
            activeOpacity={0.7}
          >
            <Send size={16} color={!isInternalNote ? "#3B82F6" : "#9CA3AF"} />
            <Text
              style={[
                styles.toggleButtonText,
                !isInternalNote && styles.toggleButtonTextActive,
              ]}
            >
              Reply
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, isInternalNote && styles.toggleButtonActive]}
            onPress={() => setIsInternalNote(true)}
            activeOpacity={0.7}
          >
            <StickyNote size={16} color={isInternalNote ? "#F59E0B" : "#9CA3AF"} />
            <Text
              style={[
                styles.toggleButtonText,
                isInternalNote && styles.toggleButtonTextActive,
              ]}
            >
              Internal Note
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder={isInternalNote ? "Add internal note..." : "Type your reply..."}
            placeholderTextColor="#9CA3AF"
            value={replyText}
            onChangeText={setReplyText}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: isInternalNote ? "#F59E0B" : "#3B82F6" },
              (!replyText.trim() || addReplyMutation.isPending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendReply}
            disabled={!replyText.trim() || addReplyMutation.isPending}
            activeOpacity={0.7}
          >
            {addReplyMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showAssignModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Assign to {assignType === "technician" ? "Technician" : "Department"}
              </Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)} activeOpacity={0.7}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList}>
              {assignType === "technician" && (
                <>
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleAssignTechnician(undefined, undefined)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalItemText, styles.modalItemUnassign]}>Unassign</Text>
                  </TouchableOpacity>
                  {techniciansQuery.data?.map((tech) => (
                    <TouchableOpacity
                      key={tech.id}
                      style={[
                        styles.modalItem,
                        ticket.assignedToId === tech.id && styles.modalItemActive,
                      ]}
                      onPress={() => handleAssignTechnician(tech.id, tech.name)}
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text style={styles.modalItemText}>{tech.name}</Text>
                        <Text style={styles.modalItemSubtext}>{tech.email}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {assignType === "department" && (
                <>
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleAssignDepartment(undefined, undefined)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalItemText, styles.modalItemUnassign]}>Unassign</Text>
                  </TouchableOpacity>
                  {departmentsQuery.data?.map((dept) => (
                    <TouchableOpacity
                      key={dept.id}
                      style={[
                        styles.modalItem,
                        ticket.departmentId === dept.id && styles.modalItemActive,
                      ]}
                      onPress={() => handleAssignDepartment(dept.id, dept.name)}
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text style={styles.modalItemText}>{dept.name}</Text>
                        <Text style={styles.modalItemSubtext}>{dept.description}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showWorkOrderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWorkOrderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Work Order ID</Text>
              <TouchableOpacity onPress={() => setShowWorkOrderModal(false)} activeOpacity={0.7}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.workOrderModalContent}>
              <Text style={styles.workOrderModalLabel}>Enter Work Order ID</Text>
              <TextInput
                style={styles.workOrderInput}
                placeholder="e.g., 24534"
                placeholderTextColor="#9CA3AF"
                value={workOrderInput}
                onChangeText={setWorkOrderInput}
                keyboardType="default"
                autoFocus
              />
              <Text style={styles.workOrderModalHint}>
                Link: https://verk.kd.is/works/{workOrderInput || "[ID]"}
              </Text>
              <View style={styles.workOrderModalActions}>
                {ticket?.workOrderId && (
                  <TouchableOpacity
                    style={styles.workOrderRemoveButton}
                    onPress={() => {
                      setWorkOrderInput("");
                      handleUpdateWorkOrder();
                    }}
                    disabled={updateWorkOrderMutation.isPending}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.workOrderRemoveButtonText}>Remove</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.workOrderSaveButton,
                    !workOrderInput.trim() && styles.workOrderSaveButtonDisabled,
                  ]}
                  onPress={handleUpdateWorkOrder}
                  disabled={!workOrderInput.trim() || updateWorkOrderMutation.isPending}
                  activeOpacity={0.7}
                >
                  {updateWorkOrderMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.workOrderSaveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
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
  ticketHeader: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  ticketHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3B82F6",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  subject: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    lineHeight: 28,
  },
  requesterInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  requesterName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  requesterEmail: {
    fontSize: 13,
    color: "#6B7280",
  },
  statusSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  statusButtonActive: {
    backgroundColor: "#F3F4F6",
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "capitalize",
  },
  messagesSection: {
    padding: 20,
  },
  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  messageCardInbound: {
    borderLeftColor: "#10B981",
  },
  messageCardInternal: {
    backgroundColor: "#FFFBEB",
    borderLeftColor: "#F59E0B",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  messageHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarCustomer: {
    backgroundColor: "#10B981",
  },
  avatarAgent: {
    backgroundColor: "#3B82F6",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  messageSender: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  internalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#FEF3C7",
  },
  internalBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F59E0B",
  },
  messageBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
  },
  replySection: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    padding: 16,
    ...Platform.select({
      web: {
        position: "relative" as const,
      },
    }),
  },
  replyTypeToggle: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  toggleButtonActive: {
    backgroundColor: "#EFF6FF",
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  toggleButtonTextActive: {
    color: "#3B82F6",
  },
  replyInputContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-end",
  },
  replyInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#1F2937",
    minHeight: 80,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  assignSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginTop: 12,
  },
  assignmentCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  assignmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  assignmentLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assignmentLabelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  assignmentValue: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  assignmentValueText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalItemActive: {
    backgroundColor: "#EFF6FF",
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  modalItemSubtext: {
    fontSize: 13,
    color: "#6B7280",
  },
  modalItemUnassign: {
    color: "#EF4444",
  },
  workOrderSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginTop: 12,
  },
  workOrderCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
  },
  workOrderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workOrderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  workOrderLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  workOrderLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  workOrderEditButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  workOrderEditText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  workOrderModalContent: {
    padding: 20,
  },
  workOrderModalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  workOrderInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  workOrderModalHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 20,
  },
  workOrderModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  workOrderRemoveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
  },
  workOrderRemoveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },
  workOrderSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
    alignItems: "center",
  },
  workOrderSaveButtonDisabled: {
    opacity: 0.5,
  },
  workOrderSaveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
