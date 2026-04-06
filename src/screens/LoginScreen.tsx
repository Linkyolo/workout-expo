import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext";
import { LoginNavProp } from "../navigation/types";

export function LoginScreen() {
  const theme = useTheme();
  const navigation = useNavigation<LoginNavProp>();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidden, setHidden] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
        <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
          Workout
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, marginBottom: 32 }}
        >
          Log in to your account
        </Text>

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
          secureTextEntry={hidden}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          disabled={loading}
          right={
            <TextInput.Icon
              icon={hidden ? "eye-off" : "eye"}
              onPress={() => setHidden((h) => !h)}
            />
          }
        />

        <HelperText type="error" visible={!!error} style={styles.error}>
          {error ?? ""}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
          contentStyle={{ paddingVertical: 6 }}
        >
          Log in
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate("Register")}
          style={{ marginTop: 8 }}
          disabled={loading}
        >
          Don't have an account? Register
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
