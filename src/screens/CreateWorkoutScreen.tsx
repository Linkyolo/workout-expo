import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useAuth } from "../auth/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { createWorkout } from "../api/client";
import { CreateWorkoutNavProp } from "../navigation/types";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function CreateWorkoutScreen() {
  const theme = useTheme();
  const { state } = useAuth();
  const token = state.status === "authenticated" ? state.token : "";
  const navigation = useNavigation<CreateWorkoutNavProp>();

  const [name, setName] = useState("");
  const [performedOn, setPerformedOn] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; date?: string }>({});

  function validate(): boolean {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Name is required";
    if (!performedOn.trim()) e.date = "Date is required";
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(performedOn))
      e.date = "Use format YYYY-MM-DD";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await createWorkout(token, {
        name: name.trim(),
        performedOn,
        notes: notes.trim() || undefined,
      });
      navigation.goBack();
    } catch (err) {
      setErrors({ name: err instanceof Error ? err.message : "Failed to create" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
        New workout
      </Text>

      <TextInput
        label="Name *"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={styles.input}
        error={!!errors.name}
        placeholder="e.g. Monday push session"
        returnKeyType="next"
      />
      <HelperText type="error" visible={!!errors.name}>
        {errors.name}
      </HelperText>

      <TextInput
        label="Date *"
        value={performedOn}
        onChangeText={setPerformedOn}
        mode="outlined"
        style={styles.input}
        error={!!errors.date}
        placeholder="YYYY-MM-DD"
        keyboardType="numeric"
        returnKeyType="next"
      />
      <HelperText type="error" visible={!!errors.date}>
        {errors.date}
      </HelperText>

      <TextInput
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={3}
        placeholder="Optional notes about the session"
        returnKeyType="done"
      />

      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.btn}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.btn}
          loading={loading}
          disabled={loading}
        >
          Create
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { marginBottom: 24, fontWeight: "600" },
  input: { marginBottom: 4 },
  actions: { flexDirection: "row", gap: 12, marginTop: 16 },
  btn: { flex: 1 },
});
