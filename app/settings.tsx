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
import { Check, Plus, UserCircle, Building2, X, Trash2 } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useBranding } from "@/contexts/BrandingContext";

export default function SettingsScreen() {
  const { branding, refetch: refetchBranding } = useBranding();
  const [activeTab, setActiveTab] = useState<"email" | "technicians" | "departments" | "branding">("email");
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
  const [techRole, setTechRole] = useState<"technician" | "admin">("technician");
  const [techDepartment, setTechDepartment] = useState<string | undefined>();

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptDescription, setDeptDescription] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColorField, setActiveColorField] = useState<"primary" | "accent" | "background" | null>(null);
  const [tempColor, setTempColor] = useState("");

  const utils = trpc.useUtils();
  const configQuery = trpc.settings.getMailboxConfig.useQuery();
  const techniciansQuery = trpc.settings.listTechnicians.useQuery();
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

  const createTechnicianMutation = trpc.settings.createTechnician.useMutation({
    onSuccess: () => {
      setShowTechModal(false);
      setTechName("");
      setTechEmail("");
      setTechRole("technician");
      setTechDepartment(undefined);
      utils.settings.listTechnicians.invalidate();
      Alert.alert("Success", "User created successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to create user");
    },
  });

  const deleteTechnicianMutation = trpc.settings.deleteTechnician.useMutation({
    onSuccess: () => {
      utils.settings.listTechnicians.invalidate();
      Alert.alert("Success", "Technician deleted successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to delete technician");
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
    onError: () => {
      Alert.alert("Error", "Failed to update branding");
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
      setPrimaryColor(brandingQuery.data.primaryColor);
      setAccentColor(brandingQuery.data.accentColor);
      setBackgroundColor(brandingQuery.data.backgroundColor);
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

  const handleCreateTechnician = () => {
    if (!techName || !techEmail) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    createTechnicianMutation.mutate({
      name: techName,
      email: techEmail,
      role: techRole,
      departmentId: techDepartment,
    });
  };

  const handleDeleteTechnician = (id: string, name: string) => {
    Alert.alert(
      "Delete Technician",
      `Are you sure you want to delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteTechnicianMutation.mutate({ id }) },
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
    if (!companyName || !primaryColor || !accentColor || !backgroundColor) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    updateBrandingMutation.mutate({
      companyName,
      primaryColor,
      accentColor,
      backgroundColor,
    });
  };

  const openColorPicker = (field: "primary" | "accent" | "background") => {
    setActiveColorField(field);
    if (field === "primary") setTempColor(primaryColor);
    else if (field === "accent") setTempColor(accentColor);
    else setTempColor(backgroundColor);
    setShowColorPicker(true);
  };

  const saveColor = () => {
    if (activeColorField === "primary") setPrimaryColor(tempColor);
    else if (activeColorField === "accent") setAccentColor(tempColor);
    else if (activeColorField === "background") setBackgroundColor(tempColor);
    setShowColorPicker(false);
  };

  const predefinedColors = [
    "#3B82F6", "#10B981", "#EF4444", "#F59E0B",
    "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
    "#1F2937", "#6B7280", "#F9FAFB", "#FFFFFF",
  ];

  if (configQuery.isLoading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
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
          style={[styles.tab, activeTab === "technicians" && styles.tabActive]}
          onPress={() => setActiveTab("technicians")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "technicians" && styles.tabTextActive]}>
            Technicians
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

        {activeTab === "technicians" && (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Technicians</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowTechModal(true)}
                activeOpacity={0.7}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add User</Text>
              </TouchableOpacity>
            </View>

            {techniciansQuery.isLoading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : (
              techniciansQuery.data?.map((tech) => {
                const dept = departmentsQuery.data?.find(d => d.id === tech.departmentId);
                return (
                  <View key={tech.id} style={styles.listItem}>
                    <View style={styles.listItemIcon}>
                      <UserCircle size={24} color="#3B82F6" />
                    </View>
                    <View style={styles.listItemContent}>
                      <View style={styles.listItemTitleRow}>
                        <Text style={styles.listItemTitle}>{tech.name}</Text>
                        {tech.role === "admin" && (
                          <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>Admin</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.listItemSubtitle}>{tech.email}</Text>
                      {dept && (
                        <Text style={styles.listItemDept}>{dept.name}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteTechnician(tech.id, tech.name)}
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
              <Text style={styles.sectionTitle}>Company Branding</Text>
              <Text style={styles.sectionDescription}>
                Customize your company name and color scheme
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

              <View style={styles.field}>
                <Text style={styles.label}>Primary Color</Text>
                <View style={styles.colorInputContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="#3B82F6"
                    placeholderTextColor="#9CA3AF"
                    value={primaryColor}
                    onChangeText={setPrimaryColor}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={[styles.colorPreview, { backgroundColor: primaryColor || "#3B82F6" }]}
                    onPress={() => openColorPicker("primary")}
                    activeOpacity={0.7}
                  />
                </View>
                <Text style={styles.helperText}>Used for buttons, links, and primary actions</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Accent Color</Text>
                <View style={styles.colorInputContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="#10B981"
                    placeholderTextColor="#9CA3AF"
                    value={accentColor}
                    onChangeText={setAccentColor}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={[styles.colorPreview, { backgroundColor: accentColor || "#10B981" }]}
                    onPress={() => openColorPicker("accent")}
                    activeOpacity={0.7}
                  />
                </View>
                <Text style={styles.helperText}>Used for success states and accents</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Background Color</Text>
                <View style={styles.colorInputContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="#F9FAFB"
                    placeholderTextColor="#9CA3AF"
                    value={backgroundColor}
                    onChangeText={setBackgroundColor}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={[styles.colorPreview, { backgroundColor: backgroundColor || "#F9FAFB" }]}
                    onPress={() => openColorPicker("background")}
                    activeOpacity={0.7}
                  />
                </View>
                <Text style={styles.helperText}>Main background color for the app</Text>
              </View>
            </View>

            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <View style={styles.previewContainer}>
                <TouchableOpacity
                  style={[styles.previewButton, { backgroundColor: primaryColor || "#3B82F6" }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.previewButtonText}>Primary Button</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.previewButton, { backgroundColor: accentColor || "#10B981" }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.previewButtonText}>Accent Button</Text>
                </TouchableOpacity>
              </View>
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
            style={[styles.saveButton, { backgroundColor: branding.primaryColor }, updateBrandingMutation.isPending && styles.saveButtonDisabled]}
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
                      techRole === "technician" && styles.pickerActive,
                    ]}
                    onPress={() => setTechRole("technician")}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerOption}>Technician</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.picker,
                      techRole === "admin" && styles.pickerActive,
                    ]}
                    onPress={() => setTechRole("admin")}
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
                style={[styles.modalButton, createTechnicianMutation.isPending && styles.modalButtonDisabled]}
                onPress={handleCreateTechnician}
                disabled={createTechnicianMutation.isPending}
                activeOpacity={0.7}
              >
                {createTechnicianMutation.isPending ? (
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

      <Modal
        visible={showColorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Color</Text>
              <TouchableOpacity onPress={() => setShowColorPicker(false)} activeOpacity={0.7}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.field}>
                <Text style={styles.label}>Hex Color</Text>
                <TextInput
                  style={styles.input}
                  placeholder="#3B82F6"
                  placeholderTextColor="#9CA3AF"
                  value={tempColor}
                  onChangeText={setTempColor}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.colorPreviewLarge}>
                <View style={[styles.colorPreviewFull, { backgroundColor: tempColor || "#FFFFFF" }]} />
              </View>

              <Text style={styles.label}>Quick Presets</Text>
              <View style={styles.colorGrid}>
                {predefinedColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorGridItem,
                      { backgroundColor: color },
                      tempColor === color && styles.colorGridItemActive,
                    ]}
                    onPress={() => setTempColor(color)}
                    activeOpacity={0.7}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: branding.primaryColor }]}
                onPress={saveColor}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>Apply Color</Text>
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
  colorInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  colorPreview: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  helperText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
  },
  previewSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginBottom: 12,
  },
  previewContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  previewButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  previewButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
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
  colorPreviewLarge: {
    marginBottom: 20,
  },
  colorPreviewFull: {
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  colorGridItem: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorGridItemActive: {
    borderColor: "#3B82F6",
    borderWidth: 3,
  },
});
