import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext";
import { RegisterNavProp } from "../navigation/types";

export function RegisterScreen() {
  const theme = useTheme();
  const navigation = useNavigation<RegisterNavProp>();
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [hidePw, setHidePw] = useState(true);
  const [hideConfirm, setHideConfirm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): boolean {
    if (!displayName.trim()) { setError("Name is required"); return false; }
    if (!email.trim()) { setError("Email is required"); return false; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return false; }
    if (password !== confirm) { setError("Passwords do not match"); return false; }
    return true;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      await register(email.trim().toLowerCase(), password, displayName.trim());
      // Cognito sends the verification email automatically
      // Navigate passing the email so ConfirmEmailScreen can use it
      navigation.navigate("ConfirmEmail", { email: email.trim().toLowerCase() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.inner}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Create account
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 28 }}>
          Fill in your details to get started
        </Text>

        <TextInput
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          mode="outlined"
          style={styles.input}
          autoCapitalize="words"
          returnKeyType="next"
          disabled={loading}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="next"
          disabled={loading}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry={hidePw}
          autoCapitalize="none"
          returnKeyType="next"
          disabled={loading}
          right={
            <TextInput.Icon
              icon={hidePw ? "eye-off" : "eye"}
              onPress={() => setHidePw((h) => !h)}
            />
          }
        />

        <TextInput
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          mode="outlined"
          style={styles.input}
          secureTextEntry={hideConfirm}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleRegister}
          disabled={loading}
          right={
            <TextInput.Icon
              icon={hideConfirm ? "eye-off" : "eye"}
              onPress={() => setHideConfirm((h) => !h)}
            />
          }
        />

        <HelperText type="error" visible={!!error} style={styles.error}>
          {error ?? ""}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          style={styles.button}
          contentStyle={{ paddingVertical: 6 }}
        >
          Create account
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate("Login")}
          style={{ marginTop: 8 }}
          disabled={loading}
        >
          Already have an account? Log in
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: "center", padding: 28 },
  title: { fontWeight: "700", marginBottom: 4 },
  input: { marginBottom: 12 },
  error: { marginBottom: 8 },
  button: { marginTop: 4, borderRadius: 8 },
});
