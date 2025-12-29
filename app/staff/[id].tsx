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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Save, Trash2, UserCircle } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

export default function StaffDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [departmentId, setDepartmentId] = useState<string | undefined>();

  const utils = trpc.useUtils();
  const staffQuery = trpc.settings.listStaff.useQuery();
  const departmentsQuery = trpc.settings.listDepartments.useQuery();

  const staff = staffQuery.data?.find((s) => s.id === id);

  const updateMutation = trpc.settings.updateStaff.useMutation({
    onSuccess: () => {
      utils.settings.listStaff.invalidate();
      Alert.alert("Success", "Staff member updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      Alert.alert("Error", `Failed to update staff member: ${error.message}`);
    },
  });

  const deleteMutation = trpc.settings.deleteStaff.useMutation({
    onSuccess: () => {
      utils.settings.listStaff.invalidate();
      Alert.alert("Success", "Staff member deleted successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      Alert.alert("Error", `Failed to delete staff member: ${error.message}`);
    },
  });

  useEffect(() => {
    if (staff) {
      setName(staff.name);
      setEmail(staff.email);
      setRole(staff.role);
      setDepartmentId(staff.departmentId);
    }
  }, [staff]);

  const handleSave = () => {
    if (!name || !email) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    updateMutation.mutate({
      id: id!,
      name,
      email,
      role,
      departmentId,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Staff Member",
      `Are you sure you want to delete ${staff?.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate({ id: id! }),
        },
      ]
    );
  };

  const isAdmin = user?.role === "Administrator" || user?.role === "admin";

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Stack.Screen
          options={{
            title: "Staff Details",
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                <ArrowLeft size={24} color="#1F2937" />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.unauthorizedContainer}>
          <Text style={styles.unauthorizedText}>
            You don&apos;t have permission to access this page.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (staffQuery.isLoading || !staff) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Stack.Screen
          options={{
            title: "Staff Details",
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                <ArrowLeft size={24} color="#1F2937" />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "Staff Details",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              style={styles.deleteIconButton}
            >
              <Trash2 size={22} color="#EF4444" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <UserCircle size={64} color="#3B82F6" strokeWidth={1.5} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{staff.name}</Text>
            <Text style={styles.headerEmail}>{staff.email}</Text>
            {staff.role === "admin" && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Staff Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Staff ID</Text>
            <Text style={styles.infoValue}>{staff.id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.statusBadge, staff.isActive ? styles.statusActive : styles.statusInactive]}>
              <Text style={styles.statusText}>{staff.isActive ? "Active" : "Inactive"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Details</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="email@company.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Role *</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[styles.picker, role === "staff" && styles.pickerActive]}
                onPress={() => setRole("staff")}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerOption}>Staff</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.picker, role === "admin" && styles.pickerActive]}
                onPress={() => setRole("admin")}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerOption}>Admin</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Department</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[styles.picker, !departmentId && styles.pickerActive]}
                onPress={() => setDepartmentId(undefined)}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerOption}>None</Text>
              </TouchableOpacity>
              {departmentsQuery.data?.map((dept) => (
                <TouchableOpacity
                  key={dept.id}
                  style={[styles.picker, departmentId === dept.id && styles.pickerActive]}
                  onPress={() => setDepartmentId(dept.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerOption}>{dept.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Trash2 size={20} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Delete Staff Member</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  unauthorizedText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  headerEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  adminBadge: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
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
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: "#D1FAE5",
  },
  statusInactive: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
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
  dangerZone: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginBottom: 12,
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
    marginBottom: 12,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingVertical: 14,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  deleteIconButton: {
    padding: 8,
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
});
