import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Hash, Send, Users, ChevronLeft, Menu, Ticket, Plus, X } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import type { ChatChannel, ChatMessage, TaggableUser, TaggableDepartment } from "@/backend/types/chat";
import type { Ticket as TicketType } from "@/backend/types/ticket";
import { useBranding } from "@/contexts/BrandingContext";

export default function ChatScreen() {
  const router = useRouter();
  const { colors } = useBranding();
  const [selectedChannelId, setSelectedChannelId] = useState<string>("general");
  const [messageText, setMessageText] = useState("");
  const [showChannels, setShowChannels] = useState(true);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showTickets, setShowTickets] = useState(false);
  const [ticketQuery, setTicketQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelDepartment, setChannelDepartment] = useState("all");
  const [channelDescription, setChannelDescription] = useState("");
  const [isPrivateChannel, setIsPrivateChannel] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const currentUser = { id: "user1", name: "Current User", role: "admin" as const };

  const channelsQuery = trpc.chat.getChannels.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const messagesQuery = trpc.chat.getMessages.useQuery(
    { channelId: selectedChannelId, limit: 100 },
    {
      refetchInterval: 3000,
      enabled: !!selectedChannelId,
    }
  );

  const usersQuery = trpc.chat.getUsersForTagging.useQuery(
    { query: mentionQuery },
    { 
      staleTime: 0,
      refetchInterval: 5000
    }
  );

  const departmentsForTaggingQuery = trpc.chat.getDepartmentsForTagging.useQuery(
    { query: mentionQuery },
    { 
      staleTime: 0,
      refetchInterval: 5000
    }
  );

  const ticketsQuery = trpc.tickets.list.useQuery(
    { status: "all", search: undefined },
    { 
      staleTime: 0,
      refetchInterval: 5000
    }
  );

  const departmentsQuery = trpc.settings.listDepartments.useQuery();

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      messagesQuery.refetch();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  const utils = trpc.useUtils();
  const createChannelMutation = trpc.chat.createChannel.useMutation({
    onSuccess: (newChannel) => {
      setShowCreateChannel(false);
      setChannelName("");
      setChannelDepartment("all");
      setChannelDescription("");
      setIsPrivateChannel(false);
      utils.chat.getChannels.invalidate();
      Alert.alert("Success", "Channel created successfully");
      setSelectedChannelId(newChannel.id);
    },
    onError: () => {
      Alert.alert("Error", "Failed to create channel");
    },
  });

  const selectedChannel = channelsQuery.data?.find((c) => c.id === selectedChannelId);

  const handleCreateChannel = () => {
    if (!channelName.trim()) {
      Alert.alert("Error", "Please enter a channel name");
      return;
    }
    createChannelMutation.mutate({
      name: channelName.trim(),
      department: channelDepartment,
      description: channelDescription.trim() || undefined,
      isPrivate: isPrivateChannel,
    });
  };

  useEffect(() => {
    if (messagesQuery.data && messagesQuery.data.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [selectedChannelId, messagesQuery.data]);

  const extractMentions = (text: string): { userIds: string[], departmentIds: string[] } => {
    const mentionPattern = /@([\w\s]+?)(?=\s|$|[^\w\s])/g;
    const userIds: string[] = [];
    const departmentIds: string[] = [];
    const users = usersQuery.data || [];
    const departments = departmentsForTaggingQuery.data || [];
    
    let match;
    while ((match = mentionPattern.exec(text)) !== null) {
      const mentionedName = match[1].trim();
      
      const department = departments.find((d) => d.name.toLowerCase() === mentionedName.toLowerCase());
      if (department) {
        departmentIds.push(department.id);
        continue;
      }
      
      const user = users.find((u) => u.name.toLowerCase() === mentionedName.toLowerCase());
      if (user) {
        userIds.push(user.id);
      }
    }
    
    return { userIds, departmentIds };
  };

  const extractTicketReferences = (text: string): string[] => {
    const ticketPattern = /#(\d+)/g;
    const references: string[] = [];
    const tickets = ticketsQuery.data || [];
    
    let match;
    while ((match = ticketPattern.exec(text)) !== null) {
      const ticketNumber = match[1];
      const ticket = tickets.find(t => t.ticketNumber.toString() === ticketNumber);
      if (ticket) {
        references.push(ticket.id);
      }
    }
    
    return references;
  };

  const handleTextChange = (text: string) => {
    setMessageText(text);
    
    const beforeCursor = text.substring(0, cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf("@");
    const lastHashIndex = beforeCursor.lastIndexOf("#");
    const lastSpaceAfterAt = beforeCursor.lastIndexOf(" ", cursorPosition);
    const lastSpaceAfterHash = beforeCursor.lastIndexOf(" ", cursorPosition);
    
    if (lastAtIndex !== -1 && lastAtIndex > lastSpaceAfterAt) {
      const textAfterAt = beforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ")) {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
        setShowTickets(false);
        return;
      }
    }
    
    if (lastHashIndex !== -1 && lastHashIndex > lastSpaceAfterHash) {
      const textAfterHash = beforeCursor.substring(lastHashIndex + 1);
      if (!textAfterHash.includes(" ")) {
        setTicketQuery(textAfterHash);
        setShowTickets(true);
        setShowMentions(false);
        return;
      }
    }
    
    setShowMentions(false);
    setShowTickets(false);
  };

  const handleMentionSelect = (item: TaggableUser | TaggableDepartment) => {
    const beforeCursor = messageText.substring(0, cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const beforeMention = messageText.substring(0, lastAtIndex);
      const afterMention = messageText.substring(cursorPosition);
      const newText = `${beforeMention}@${item.name} ${afterMention}`;
      const newCursorPos = lastAtIndex + item.name.length + 2;
      setMessageText(newText);
      setCursorPosition(newCursorPos);
      setShowMentions(false);
      setMentionQuery("");
      inputRef.current?.focus();
    }
  };

  const handleTicketSelect = (ticket: TicketType) => {
    const beforeCursor = messageText.substring(0, cursorPosition);
    const lastHashIndex = beforeCursor.lastIndexOf("#");
    if (lastHashIndex !== -1) {
      const beforeTicket = messageText.substring(0, lastHashIndex);
      const afterTicket = messageText.substring(cursorPosition);
      const ticketRef = ticket.ticketNumber.toString();
      const newText = `${beforeTicket}#${ticketRef} ${afterTicket}`;
      const newCursorPos = lastHashIndex + ticketRef.length + 2;
      setMessageText(newText);
      setCursorPosition(newCursorPos);
      setShowTickets(false);
      setTicketQuery("");
      inputRef.current?.focus();
    }
  };

  const handleSendMessage = () => {
    if (messageText.trim() && selectedChannelId) {
      const { userIds, departmentIds } = extractMentions(messageText);
      const ticketReferences = extractTicketReferences(messageText);
      sendMessageMutation.mutate({
        channelId: selectedChannelId,
        content: messageText.trim(),
        mentions: userIds.length > 0 ? userIds : undefined,
        departmentMentions: departmentIds.length > 0 ? departmentIds : undefined,
        ticketReferences: ticketReferences.length > 0 ? ticketReferences : undefined,
        userId: currentUser.id,
        userName: currentUser.name,
      });
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const renderMessageContent = (content: string) => {
    const combinedPattern = /(@[\w\s]+?)(?=\s|$|[^\w\s])|(#\d+)/g;
    const parts = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    const departments = departmentsForTaggingQuery.data || [];

    while ((match = combinedPattern.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${lastIndex}`} style={[styles.messageContent, { color: colors.textPrimary }]}>
            {content.substring(lastIndex, match.index)}
          </Text>
        );
      }
      
      if (match[0].startsWith("@")) {
        const mentionName = match[0].substring(1).trim();
        const isDepartment = departments.some((d) => d.name.toLowerCase() === mentionName.toLowerCase());
        
        parts.push(
          <Text 
            key={`mention-${match.index}`} 
            style={[
              styles.mention, 
              isDepartment 
                ? { color: "#8B5CF6", backgroundColor: "#EDE9FE" }
                : { color: colors.primaryColor, backgroundColor: colors.primaryColor + '20' }
            ]}
          >
            {match[0]}
          </Text>
        );
      } else if (match[0].startsWith("#")) {
        const ticketNumber = match[0].substring(1);
        const ticket = ticketsQuery.data?.find(t => t.ticketNumber.toString() === ticketNumber);
        
        if (ticket) {
          parts.push(
            <TouchableOpacity
              key={`ticket-${match.index}`}
              onPress={() => router.push(`/ticket/${ticket.id}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.ticketReference}>{match[0]}</Text>
            </TouchableOpacity>
          );
        } else {
          parts.push(
            <Text key={`ticket-${match.index}`} style={styles.ticketReference}>
              {match[0]}
            </Text>
          );
        }
      }
      
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <Text key={`text-${lastIndex}`} style={[styles.messageContent, { color: colors.textPrimary }]}>
          {content.substring(lastIndex)}
        </Text>
      );
    }

    return <Text>{parts}</Text>;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={styles.messageContainer}>
      <View style={styles.messageHeader}>
        <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.userName}</Text>
        <Text style={[styles.userRole, { backgroundColor: colors.primaryColor }]}>{item.userRole}</Text>
        <Text style={[styles.messageTime, { color: colors.textSecondary }]}>{formatMessageTime(item.createdAt)}</Text>
      </View>
      {renderMessageContent(item.content)}
      {item.editedAt && <Text style={[styles.editedLabel, { color: colors.textSecondary }]}>(edited)</Text>}
    </View>
  );

  const renderChannel = ({ item }: { item: ChatChannel }) => {
    const isSelected = item.id === selectedChannelId;
    return (
      <TouchableOpacity
        style={[styles.channelItem, isSelected && { backgroundColor: colors.primaryColor + '20' }]}
        onPress={() => {
          setSelectedChannelId(item.id);
          if (Platform.OS !== "web") {
            setShowChannels(false);
          }
        }}
        activeOpacity={0.7}
      >
        <Hash size={18} color={isSelected ? colors.primaryColor : colors.textSecondary} />
        <View style={styles.channelInfo}>
          <Text style={[styles.channelName, { color: isSelected ? colors.primaryColor : colors.textPrimary, fontWeight: isSelected ? "600" as const : "500" as const }]}>
            {item.name}
          </Text>
          {item.description && (
            <Text style={[styles.channelDescription, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMentionSuggestion = ({ item }: { item: TaggableUser | TaggableDepartment }) => {
    const isDepartment = 'type' in item && item.type === 'department';
    
    return (
      <TouchableOpacity
        style={[styles.mentionItem, { borderBottomColor: colors.border }]}
        onPress={() => handleMentionSelect(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.mentionUserIcon, { backgroundColor: isDepartment ? "#8B5CF6" : colors.primaryColor }]}>
          {isDepartment ? (
            <Users size={18} color="#fff" />
          ) : (
            <Text style={styles.mentionUserInitial}>{item.name.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.mentionUserInfo}>
          <Text style={[styles.mentionUserName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.mentionUserRole, { color: colors.textSecondary }]}>
            {isDepartment ? `Department • ${item.userCount} ${item.userCount === 1 ? 'member' : 'members'}` : (item as TaggableUser).role}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTicketSuggestion = ({ item }: { item: TicketType }) => (
    <TouchableOpacity
      style={[styles.mentionItem, { borderBottomColor: colors.border }]}
      onPress={() => handleTicketSelect(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.mentionUserIcon, { backgroundColor: "#10B981" }]}>
        <Ticket size={18} color="#fff" />
      </View>
      <View style={styles.mentionUserInfo}>
        <Text style={[styles.mentionUserName, { color: colors.textPrimary }]}>#{item.ticketNumber}</Text>
        <Text style={[styles.mentionUserRole, { color: colors.textSecondary }]} numberOfLines={1}>{item.subject}</Text>
      </View>
    </TouchableOpacity>
  );

  const filteredTickets = ticketsQuery.data?.filter((t: TicketType) => {
    if (t.status === "closed") return false;
    if (ticketQuery === "") return true;
    
    const query = ticketQuery.toLowerCase();
    return (
      t.ticketNumber.toString().includes(query) ||
      t.subject.toLowerCase().includes(query)
    );
  }).slice(0, 8) || [];

  const getMentionSuggestions = (): (TaggableUser | TaggableDepartment)[] => {
    const users = usersQuery.data || [];
    const departments = departmentsForTaggingQuery.data || [];

    if (mentionQuery === "") {
      const shuffledDepts = [...departments].sort(() => Math.random() - 0.5);
      const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
      
      return [
        ...shuffledDepts.slice(0, 1),
        ...shuffledUsers.slice(0, 2),
      ];
    }

    const lowerQuery = mentionQuery.toLowerCase();
    const filteredDepts = departments.filter((d) =>
      d.name.toLowerCase().includes(lowerQuery)
    );
    const filteredUsers = users.filter((u) =>
      u.name.toLowerCase().includes(lowerQuery) ||
      u.email.toLowerCase().includes(lowerQuery)
    );

    return [...filteredDepts, ...filteredUsers].slice(0, 3);
  };

  const mentionSuggestions = getMentionSuggestions();

  const renderInputArea = () => (
    <>
      {showMentions && mentionSuggestions.length > 0 && (
        <View style={[styles.mentionsDropdown, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
          <FlatList
            data={mentionSuggestions}
            renderItem={renderMentionSuggestion}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            style={styles.mentionsList}
          />
        </View>
      )}
      {showTickets && filteredTickets.length > 0 && (
        <View style={[styles.mentionsDropdown, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
          <FlatList
            data={filteredTickets}
            renderItem={renderTicketSuggestion}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            style={styles.mentionsList}
          />
        </View>
      )}
      <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
          placeholder={`Message #${selectedChannel?.name || "channel"}`}
          placeholderTextColor={colors.textSecondary}
          value={messageText}
          onChangeText={handleTextChange}
          onSelectionChange={(e) => setCursorPosition(e.nativeEvent.selection.start)}
          onSubmitEditing={handleSendMessage}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.primaryColor }, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || sendMessageMutation.isPending}
          activeOpacity={0.7}
        >
          {sendMessageMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundColor }]} edges={["top"]}>
        <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Team Chat</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.webLayout}>
          <View style={[styles.channelsSidebar, { backgroundColor: colors.cardBackground, borderRightColor: colors.border }]}>
            <View style={[styles.sidebarHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.sidebarHeaderLeft}>
                <Users size={20} color={colors.textSecondary} />
                <Text style={[styles.sidebarTitle, { color: colors.textPrimary }]}>Channels</Text>
              </View>
              {currentUser.role === "admin" && (
                <TouchableOpacity
                  onPress={() => setShowCreateChannel(true)}
                  style={[styles.createChannelButton, { backgroundColor: colors.primaryColor + '20' }]}
                  activeOpacity={0.7}
                >
                  <Plus size={18} color={colors.primaryColor} />
                </TouchableOpacity>
              )}
            </View>
            {channelsQuery.isLoading ? (
              <ActivityIndicator size="small" color={colors.primaryColor} style={styles.loader} />
            ) : (
              <FlatList
                data={channelsQuery.data || []}
                renderItem={renderChannel}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.channelsList}
              />
            )}
          </View>

          <View style={[styles.chatArea, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.chatHeader, { borderBottomColor: colors.border }]}>
              <Hash size={20} color={colors.primaryColor} />
              <Text style={[styles.chatTitle, { color: colors.textPrimary }]}>{selectedChannel?.name || "Select a channel"}</Text>
            </View>

            {messagesQuery.isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primaryColor} />
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messagesQuery.data || []}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />
            )}

            <KeyboardAvoidingView behavior="padding">
              {renderInputArea()}
            </KeyboardAvoidingView>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundColor }]} edges={["top"]}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => (showChannels ? router.back() : setShowChannels(true))}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {showChannels ? "Team Chat" : `#${selectedChannel?.name}`}
        </Text>
        {!showChannels && (
          <TouchableOpacity onPress={() => setShowChannels(true)} style={styles.menuButton}>
            <Menu size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        {showChannels && <View style={styles.placeholder} />}
      </View>

      {showChannels ? (
        <View style={[styles.mobileChannelsList, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.sidebarHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.sidebarHeaderLeft}>
              <Users size={20} color={colors.textSecondary} />
              <Text style={[styles.sidebarTitle, { color: colors.textPrimary }]}>Channels</Text>
            </View>
            {currentUser.role === "admin" && (
              <TouchableOpacity
                onPress={() => setShowCreateChannel(true)}
                style={[styles.createChannelButton, { backgroundColor: colors.primaryColor + '20' }]}
                activeOpacity={0.7}
              >
                <Plus size={18} color={colors.primaryColor} />
              </TouchableOpacity>
            )}
          </View>
          {channelsQuery.isLoading ? (
            <ActivityIndicator size="large" color={colors.primaryColor} style={styles.loader} />
          ) : (
            <FlatList
              data={channelsQuery.data || []}
              renderItem={renderChannel}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.channelsList}
            />
          )}
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <View style={styles.flex}>
            {messagesQuery.isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primaryColor} />
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messagesQuery.data || []}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />
            )}

            {renderInputArea()}
          </View>
        </KeyboardAvoidingView>
      )}

      <Modal
        visible={showCreateChannel}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateChannel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Create Channel</Text>
              <TouchableOpacity onPress={() => setShowCreateChannel(false)} activeOpacity={0.7}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Channel Name</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g., Product Team"
                  placeholderTextColor={colors.textSecondary}
                  value={channelName}
                  onChangeText={setChannelName}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Department</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[
                      styles.picker,
                      { backgroundColor: colors.inputBackground, borderColor: colors.border },
                      channelDepartment === "all" && { backgroundColor: colors.primaryColor + '20', borderColor: colors.primaryColor },
                    ]}
                    onPress={() => setChannelDepartment("all")}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerOption, { color: colors.textPrimary }]}>All Departments</Text>
                  </TouchableOpacity>
                  {departmentsQuery.data?.map((dept) => (
                    <TouchableOpacity
                      key={dept.id}
                      style={[
                        styles.picker,
                        { backgroundColor: colors.inputBackground, borderColor: colors.border },
                        channelDepartment === dept.id && { backgroundColor: colors.primaryColor + '20', borderColor: colors.primaryColor },
                      ]}
                      onPress={() => setChannelDepartment(dept.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerOption, { color: colors.textPrimary }]}>{dept.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Description (Optional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="What's this channel about?"
                  placeholderTextColor={colors.textSecondary}
                  value={channelDescription}
                  onChangeText={setChannelDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.field}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setIsPrivateChannel(!isPrivateChannel)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, isPrivateChannel && { borderColor: colors.primaryColor, backgroundColor: colors.primaryColor }]}>
                    {isPrivateChannel && (
                      <View style={styles.checkboxInner} />
                    )}
                  </View>
                  <View style={styles.checkboxTextContainer}>
                    <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>Private Channel</Text>
                    <Text style={[styles.checkboxDescription, { color: colors.textSecondary }]}>
                      Only invited members can see this channel
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primaryColor }, createChannelMutation.isPending && styles.modalButtonDisabled]}
                onPress={handleCreateChannel}
                disabled={createChannelMutation.isPending}
                activeOpacity={0.7}
              >
                {createChannelMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Create Channel</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  placeholder: {
    width: 32,
  },
  webLayout: {
    flex: 1,
    flexDirection: "row" as const,
  },
  channelsSidebar: {
    width: 280,
    borderRightWidth: 1,
  },
  sidebarHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    padding: 16,
    borderBottomWidth: 1,
  },
  sidebarHeaderLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  createChannelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  channelsList: {
    padding: 8,
  },
  channelItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
  channelDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  chatArea: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  userRole: {
    fontSize: 11,
    fontWeight: "500" as const,
    color: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  messageTime: {
    fontSize: 12,
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  mention: {
    fontSize: 15,
    fontWeight: "600" as const,
    paddingHorizontal: 4,
    borderRadius: 3,
    lineHeight: 22,
  },
  ticketReference: {
    fontSize: 15,
    color: "#10B981",
    fontWeight: "600" as const,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 4,
    borderRadius: 3,
    lineHeight: 22,
    textDecorationLine: "underline" as const,
  },
  editedLabel: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: "italic" as const,
  },
  mentionsDropdown: {
    borderTopWidth: 1,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  mentionsList: {
    maxHeight: 200,
  },
  mentionItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    padding: 12,
    borderBottomWidth: 1,
  },
  mentionUserIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  mentionUserInitial: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
  mentionUserInfo: {
    flex: 1,
  },
  mentionUserName: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
  mentionUserRole: {
    fontSize: 12,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  modalInput: {
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  loader: {
    marginTop: 20,
  },
  mobileChannelsList: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  modalBody: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: "top" as const,
  },
  pickerContainer: {
    gap: 8,
  },
  picker: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  pickerOption: {
    fontSize: 15,
  },
  checkboxRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: "500" as const,
    marginBottom: 2,
  },
  checkboxDescription: {
    fontSize: 13,
  },
  modalButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center" as const,
    marginTop: 10,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
});
