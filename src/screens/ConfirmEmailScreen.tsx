import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput, useTheme } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext";
import { ConfirmEmailNavProp, ConfirmEmailRouteProp } from "../navigation/types";

export function ConfirmEmailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<ConfirmEmailNavProp>();
  const route = useRoute<ConfirmEmailRouteProp>();
  const { confirmEmail } = useAuth();

  const { email } = route.params;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleConfirm() {
    if (code.trim().length < 6) {
      setError("Enter the 6-digit code from your email");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await confirmEmail(email, code.trim());
      setSuccess(true);
      // Brief pause so the user sees the success message, then back to Login
      setTimeout(() => navigation.navigate("Login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
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
          Confirm your email
        </Text>

        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
          We sent a 6-digit code to:
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurface, fontWeight: "600", marginBottom: 28 }}
        >
          {email}
        </Text>

        {success ? (
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.primary, textAlign: "center", marginBottom: 16 }}
          >
            ✓ Email confirmed! Redirecting to login…
          </Text>
        ) : (
          <>
            <TextInput
              label="Verification code"
              value={code}
              onChangeText={setCode}
              mode="outlined"
              style={styles.input}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
              disabled={loading}
            />

            <HelperText type="error" visible={!!error} style={styles.error}>
              {error ?? ""}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleConfirm}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={{ paddingVertical: 6 }}
            >
              Confirm
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate("Login")}
              style={{ marginTop: 8 }}
              disabled={loading}
            >
              Back to login
            </Button>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: "center", padding: 28 },
  title: { fontWeight: "700", marginBottom: 16 },
  input: { marginBottom: 4 },
  error: { marginBottom: 8 },
  button: { marginTop: 4, borderRadius: 8 },
});
