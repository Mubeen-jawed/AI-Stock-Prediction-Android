import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_URL } from "../config/config";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // inside your component:
  const handleSignup = async () => {
    const res = await fetch(`${API_URL}/api/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Signup failed");

    // If backend also returns token & user:
    await login(data.user, data.token);
    router.replace("/home");
  };
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {error && <Text style={{ color: "red", marginTop: 8 }}>{error}</Text>}

      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sign Up</Text>

          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.switchText}>Login</Text>
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={styles.content}>
          {/* Email / Phone Toggle */}

          {/* Name */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <Ionicons name="person-outline" size={18} color="#B0B0B0" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#666872"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Email or Phone */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <MaterialIcons name="email" size={18} color="#B0B0B0" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666872"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <Ionicons name="lock-closed-outline" size={18} color="#B0B0B0" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666872"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#666872"
              />
            </TouchableOpacity>
          </View>

          {/* Signup Button */}
          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupButtonText}>Sign Up</Text>
          </TouchableOpacity>

          {/* Divider */}
          {/* <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Or sign up with</Text>
            <View style={styles.divider} />
          </View> */}

          {/* Social Buttons */}
          {/* <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => console.log("Google signup")}
            >
              <FontAwesome name="google" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => console.log("Telegram signup")}
            >
              <Ionicons name="paper-plane-outline" size={22} color="#42A5F5" />
            </TouchableOpacity>
          </View> */}

          {/* Already have account */}
          <TouchableOpacity
            style={styles.alreadyRow}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.alreadyText}>
              Already have an account?{" "}
              <Text style={styles.alreadyLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    alignItems: "center",
  },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  switchText: { color: "#FFA726", fontWeight: "600" },

  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  toggleContainer: { flexDirection: "row", marginBottom: 20 },
  toggleButton: {
    flex: 1,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  },
  toggleButtonActive: { backgroundColor: "#1F1F23" },
  toggleText: { color: "#777B82" },
  toggleTextActive: { color: "#FFF", fontWeight: "600" },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#131316",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 56,
    marginBottom: 16,
  },
  inputIcon: { width: 30, alignItems: "center" },
  input: { flex: 1, color: "#FFF", fontSize: 15 },
  eyeIcon: { paddingHorizontal: 6 },

  signupButton: {
    height: 56,
    backgroundColor: "#FFD700",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 30,
  },
  signupButtonText: { color: "#000", fontWeight: "700", fontSize: 16 },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#2A2A2E" },
  dividerText: { color: "#6F727A", marginHorizontal: 10 },

  socialRow: { flexDirection: "row", justifyContent: "center", gap: 30 },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#2C2C31",
    justifyContent: "center",
    alignItems: "center",
  },

  alreadyRow: {
    marginTop: 20,
    alignItems: "center",
  },
  alreadyText: {
    color: "#9A9CA4",
    fontSize: 13,
  },
  alreadyLink: {
    color: "#FFA726",
    fontWeight: "600",
  },
});
