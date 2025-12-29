import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Plus, UserCircle, Building2, X, Trash2, AlertCircle } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useBranding } from "@/contexts/BrandingContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";

type ThemeType = "light" | "dark" | "plex";

export default function SettingsScreen() {
  const { colors, refetch: refetchBranding } = useBranding();
  const { user } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === "Administrator" || user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"email" | "staff" | "departments" | "branding">("email");
  const [supportEmail, setSupportEmail] = useState("");
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("");
  const [imapUsername, setImapUsername] = useState("");
  const [imapPassword, setImapPassword] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [emailSignature, setEmailSignature] = useState("");

  const [showTechModal, setShowTechModal] = useState(false);
  const [techName, setTechName] = useState("");
  const [techEmail, setTechEmail] = useState("");
  const [staffRole, setStaffRole] = useState<"staff" | "admin">("staff");
  const [techDepartment, setTechDepartment] = useState<string | undefined>();

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptDescription, setDeptDescription] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>("light");

  const utils = trpc.useUtils();
  const configQuery = trpc.settings.getMailboxConfig.useQuery();
  const staffQuery = trpc.settings.listStaff.useQuery();
  const departmentsQuery = trpc.settings.listDepartments.useQuery();
  const brandingQuery = trpc.settings.getBranding.useQuery();

  const updateMutation = trpc.settings.updateMailboxConfig.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Mailbox configuration updated successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to update mailbox configuration");
    },
  });

  const createStaffMutation = trpc.settings.createStaff.useMutation({
    onSuccess: () => {
      setShowTechModal(false);
      setTechName("");
      setTechEmail("");
      setStaffRole("staff");
      setTechDepartment(undefined);
      utils.settings.listStaff.invalidate();
      Alert.alert("Success", "User created successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to create user");
    },
  });

  const deleteStaffMutation = trpc.settings.deleteStaff.useMutation({
    onSuccess: () => {
      utils.settings.listStaff.invalidate();
      Alert.alert("Success", "Staff member deleted successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to delete staff member");
    },
  });

  const createDepartmentMutation = trpc.settings.createDepartment.useMutation({
    onSuccess: async () => {
      setShowDeptModal(false);
      setDeptName("");
      setDeptDescription("");
      await utils.settings.listDepartments.invalidate();
      Alert.alert("Success", "Department created successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to create department");
    },
  });

  const updateBrandingMutation = trpc.settings.updateBranding.useMutation({
    onSuccess: async () => {
      await utils.settings.getBranding.invalidate();
      await refetchBranding();
      Alert.alert("Success", "Branding updated successfully");
    },
    onError: (error) => {
      console.error("Branding update error:", error);
      Alert.alert("Error", `Failed to update branding: ${error.message}`);
    },
  });

  useEffect(() => {
    if (configQuery.data) {
      setSupportEmail(configQuery.data.supportEmail);
      setImapHost(configQuery.data.imapHost);
      setImapPort(configQuery.data.imapPort.toString());
      setImapUsername(configQuery.data.imapUsername);
      setImapPassword(configQuery.data.imapPassword);
      setSmtpHost(configQuery.data.smtpHost);
      setSmtpPort(configQuery.data.smtpPort.toString());
      setSmtpUsername(configQuery.data.smtpUsername);
      setSmtpPassword(configQuery.data.smtpPassword);
      setEmailSignature(configQuery.data.emailSignature);
    }
  }, [configQuery.data]);

  useEffect(() => {
    if (brandingQuery.data) {
      setCompanyName(brandingQuery.data.companyName);
      setSelectedTheme(brandingQuery.data.theme);
    }
  }, [brandingQuery.data]);

  const handleSave = () => {
    updateMutation.mutate({
      supportEmail,
      imapHost,
      imapPort: parseInt(imapPort, 10) || 993,
      imapUsername,
      imapPassword,
      smtpHost,
      smtpPort: parseInt(smtpPort, 10) || 587,
      smtpUsername,
      smtpPassword,
      emailSignature,
    });
  };

  const handleCreateStaff = () => {
    if (!techName || !techEmail) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    createStaffMutation.mutate({
      name: techName,
      email: techEmail,
      role: staffRole,
      departmentId: techDepartment,
    });
  };

  const handleDeleteStaff = (id: string, name: string) => {
    Alert.alert(
      "Delete Staff Member",
      `Are you sure you want to delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteStaffMutation.mutate({ id }) },
      ]
    );
  };

  const handleCreateDepartment = () => {
    if (!deptName || !deptDescription) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    createDepartmentMutation.mutate({
      name: deptName,
      description: deptDescription,
    });
  };

  const handleSaveBranding = () => {
    if (!companyName) {
      Alert.alert("Error", "Please enter a company name");
      return;
    }
    updateBrandingMutation.mutate({
      companyName,
      theme: selectedTheme,
    });
  };

  const themes = [
    {
      id: "light" as const,
      name: "Light Mode",
      description: "Clean and bright interface",
      preview: { bg: "#F9FAFB", primary: "#3B82F6", text: "#1F2937" },
    },
    {
      id: "dark" as const,
      name: "Dark Mode",
      description: "Easy on the eyes",
      preview: { bg: "#111827", primary: "#3B82F6", text: "#F9FAFB" },
    },
    {
      id: "plex" as const,
      name: "Plex Theme",
      description: "Inspired by Plex Media Server",
      preview: { bg: "#1F1F1F", primary: "#E5A00D", text: "#FFFFFF" },
    },
  ];

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.unauthorizedContainer}>
          <AlertCircle size={64} color="#EF4444" strokeWidth={2} />
          <Text style={styles.unauthorizedTitle}>Access Denied</Text>
          <Text style={styles.unauthorizedMessage}>
            You don&apos;t have permission to access this page.
            Only administrators can manage settings.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/" as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (configQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "email" && styles.tabActive]}
          onPress={() => setActiveTab("email")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "email" && styles.tabTextActive]}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "staff" && styles.tabActive]}
          onPress={() => setActiveTab("staff")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "staff" && styles.tabTextActive]}>
            Staff
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "departments" && styles.tabActive]}
          onPress={() => setActiveTab("departments")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "departments" && styles.tabTextActive]}>
            Departments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "branding" && styles.tabActive]}
          onPress={() => setActiveTab("branding")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "branding" && styles.tabTextActive]}>
            Branding
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === "email" && (
          <>
            <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Configuration</Text>
          <Text style={styles.sectionDescription}>
            Configure your support email address and mailbox settings
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Support Email</Text>
            <TextInput
              style={styles.input}
              placeholder="support@company.com"
              placeholderTextColor="#9CA3AF"
              value={supportEmail}
              onChangeText={setSupportEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IMAP Settings (Incoming)</Text>
          <Text style={styles.sectionDescription}>
            Configure IMAP to receive incoming support emails
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>IMAP Host</Text>
            <TextInput
              style={styles.input}
              placeholder="imap.gmail.com"
              placeholderTextColor="#9CA3AF"
              value={imapHost}
              onChangeText={setImapHost}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>IMAP Port</Text>
            <TextInput
              style={styles.input}
              placeholder="993"
              placeholderTextColor="#9CA3AF"
              value={imapPort}
              onChangeText={setImapPort}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>IMAP Username</Text>
            <TextInput
              style={styles.input}
              placeholder="username"
              placeholderTextColor="#9CA3AF"
              value={imapUsername}
              onChangeText={setImapUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>IMAP Password</Text>
            <TextInput
              style={styles.input}
              placeholder="password"
              placeholderTextColor="#9CA3AF"
              value={imapPassword}
              onChangeText={setImapPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SMTP Settings (Outgoing)</Text>
          <Text style={styles.sectionDescription}>
            Configure SMTP to send email replies to customers
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>SMTP Host</Text>
            <TextInput
              style={styles.input}
              placeholder="smtp.gmail.com"
              placeholderTextColor="#9CA3AF"
              value={smtpHost}
              onChangeText={setSmtpHost}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>SMTP Port</Text>
            <TextInput
              style={styles.input}
              placeholder="587"
              placeholderTextColor="#9CA3AF"
              value={smtpPort}
              onChangeText={setSmtpPort}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>SMTP Username</Text>
            <TextInput
              style={styles.input}
              placeholder="username"
              placeholderTextColor="#9CA3AF"
              value={smtpUsername}
              onChangeText={setSmtpUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>SMTP Password</Text>
            <TextInput
              style={styles.input}
              placeholder="password"
              placeholderTextColor="#9CA3AF"
              value={smtpPassword}
              onChangeText={setSmtpPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Signature</Text>
          <Text style={styles.sectionDescription}>
            This signature will be added to all outgoing emails
          </Text>

          <View style={styles.field}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Best regards,&#10;Support Team"
              placeholderTextColor="#9CA3AF"
              value={emailSignature}
              onChangeText={setEmailSignature}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
          </>
        )}

        {activeTab === "staff" && (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Staff</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowTechModal(true)}
                activeOpacity={0.7}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add User</Text>
              </TouchableOpacity>
            </View>

            {staffQuery.isLoading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : (
              staffQuery.data?.map((staff) => {
                const dept = departmentsQuery.data?.find(d => d.id === staff.departmentId);
                return (
                  <View key={staff.id} style={styles.listItem}>
                    <View style={styles.listItemIcon}>
                      <UserCircle size={24} color="#3B82F6" />
                    </View>
                    <View style={styles.listItemContent}>
                      <View style={styles.listItemTitleRow}>
                        <Text style={styles.listItemTitle}>{staff.name}</Text>
                        {staff.role === "admin" && (
                          <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>Admin</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.listItemSubtitle}>{staff.email}</Text>
                      {dept && (
                        <Text style={styles.listItemDept}>{dept.name}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteStaff(staff.id, staff.name)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </>
        )}

        {activeTab === "departments" && (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Departments</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowDeptModal(true)}
                activeOpacity={0.7}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Department</Text>
              </TouchableOpacity>
            </View>

            {departmentsQuery.isLoading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : (
              departmentsQuery.data?.map((dept) => (
                <View key={dept.id} style={styles.listItem}>
                  <View style={styles.listItemIcon}>
                    <Building2 size={24} color="#10B981" />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{dept.name}</Text>
                    <Text style={styles.listItemSubtitle}>{dept.description}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === "branding" && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Company Information</Text>
              <Text style={styles.sectionDescription}>
                Customize your company name
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>Company Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="KDesk"
                  placeholderTextColor="#9CA3AF"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Theme</Text>
              <Text style={styles.sectionDescription}>
                Choose your preferred color scheme
              </Text>

              {themes.map((theme) => (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themeCard,
                    selectedTheme === theme.id && styles.themeCardActive,
                  ]}
                  onPress={() => setSelectedTheme(theme.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.themePreview}>
                    <View style={[styles.themePreviewBg, { backgroundColor: theme.preview.bg }]}>
                      <View style={[styles.themePreviewCard, { backgroundColor: theme.preview.primary }]} />
                      <View style={[styles.themePreviewText, { backgroundColor: theme.preview.text }]} />
                      <View style={[styles.themePreviewText, { backgroundColor: theme.preview.text, opacity: 0.6 }]} />
                    </View>
                  </View>
                  <View style={styles.themeInfo}>
                    <View style={styles.themeHeader}>
                      <Text style={styles.themeName}>{theme.name}</Text>
                      {selectedTheme === theme.id && (
                        <View style={[styles.themeBadge, { backgroundColor: colors.primaryColor }]}>
                          <Check size={14} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.themeDescription}>{theme.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {activeTab === "email" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, updateMutation.isPending && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={updateMutation.isPending}
            activeOpacity={0.8}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Configuration</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "branding" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primaryColor }, updateBrandingMutation.isPending && styles.saveButtonDisabled]}
            onPress={handleSaveBranding}
            disabled={updateBrandingMutation.isPending}
            activeOpacity={0.8}
          >
            {updateBrandingMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Branding</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showTechModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTechModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add User</Text>
              <TouchableOpacity onPress={() => setShowTechModal(false)} activeOpacity={0.7}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.field}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  value={techName}
                  onChangeText={setTechName}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="john@company.com"
                  placeholderTextColor="#9CA3AF"
                  value={techEmail}
                  onChangeText={setTechEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Role</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[
                      styles.picker,
                      staffRole === "staff" && styles.pickerActive,
                    ]}
                    onPress={() => setStaffRole("staff")}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerOption}>Staff</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.picker,
                      staffRole === "admin" && styles.pickerActive,
                    ]}
                    onPress={() => setStaffRole("admin")}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerOption}>Admin</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Department (Optional)</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[
                      styles.picker,
                      !techDepartment && styles.pickerActive,
                    ]}
                    onPress={() => setTechDepartment(undefined)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerOption}>None</Text>
                  </TouchableOpacity>
                  {departmentsQuery.data?.map((dept) => (
                    <TouchableOpacity
                      key={dept.id}
                      style={[
                        styles.picker,
                        techDepartment === dept.id && styles.pickerActive,
                      ]}
                      onPress={() => setTechDepartment(dept.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pickerOption}>{dept.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalButton, createStaffMutation.isPending && styles.modalButtonDisabled]}
                onPress={handleCreateStaff}
                disabled={createStaffMutation.isPending}
                activeOpacity={0.7}
              >
                {createStaffMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Create User</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeptModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeptModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Department</Text>
              <TouchableOpacity onPress={() => setShowDeptModal(false)} activeOpacity={0.7}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.field}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Technical Support"
                  placeholderTextColor="#9CA3AF"
                  value={deptName}
                  onChangeText={setDeptName}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Handles technical issues..."
                  placeholderTextColor="#9CA3AF"
                  value={deptDescription}
                  onChangeText={setDeptDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.modalButton, createDepartmentMutation.isPending && styles.modalButtonDisabled]}
                onPress={handleCreateDepartment}
                disabled={createDepartmentMutation.isPending}
                activeOpacity={0.7}
              >
                {createDepartmentMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Create Department</Text>
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
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
    lineHeight: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  themeCard: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  themeCardActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  themePreview: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 16,
  },
  themePreviewBg: {
    flex: 1,
    padding: 8,
    justifyContent: "center",
    gap: 6,
  },
  themePreviewCard: {
    height: 14,
    borderRadius: 4,
  },
  themePreviewText: {
    height: 6,
    borderRadius: 2,
  },
  themeInfo: {
    flex: 1,
    justifyContent: "center",
  },
  themeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  themeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  themeDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  themeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#3B82F6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#3B82F6",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  listItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  listItemDept: {
    fontSize: 12,
    color: "#3B82F6",
    marginTop: 4,
  },
  listItemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  adminBadge: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  deleteButton: {
    padding: 8,
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
  modalBody: {
    padding: 20,
  },
  pickerContainer: {
    gap: 8,
  },
  picker: {
    padding: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pickerActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  pickerOption: {
    fontSize: 15,
    color: "#1F2937",
  },
  modalButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#FFFFFF",
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginTop: 24,
    marginBottom: 12,
  },
  unauthorizedMessage: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
