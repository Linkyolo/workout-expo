import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext";
import { addEntry, addRoute, deleteRoute, updateEntry, deleteEntry } from "../api/client";
import { LogEntriesNavProp, LogEntriesRouteProp } from "../navigation/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type SetRow = {
  key: string;
  entryId?: string;   // undefined = new row, set = loaded from DB
  reps: string;
  weightKg: string;
  durationMins: string;
  durationSecs: string;
  distanceKm: string;
};

type ClimbingRoute = {
  key: string;
  difficulty: string;
  completed: boolean;
  attempts: string;
  isNew: boolean;
};

function emptySet(): SetRow {
  return {
    key: String(Date.now() + Math.random()),
    reps: "",
    weightKg: "",
    durationMins: "",
    durationSecs: "",
    distanceKm: "",
  };
}

function emptyRoute(): ClimbingRoute {
  return {
    key: String(Date.now() + Math.random()),
    difficulty: "",
    completed: false,
    attempts: "1",
    isNew: true,
  };
}

// const V_GRADES = ["VB", "V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10"];
const V_GRADES = ["100", "120", "140", "160", "180", "200", "220", "240", "260", "280", "300", "320"];

// ── Field renderers ───────────────────────────────────────────────────────────

type RowFieldsProps = {
  row: SetRow;
  index: number;
  onChange: (key: string, field: keyof SetRow, value: string) => void;
};

function StrengthFields({ row, index, onChange }: RowFieldsProps) {
  return (
    <View style={styles.rowFields}>
      <Text style={styles.setLabel}>Set {index + 1}</Text>
      <TextInput label="Reps" value={row.reps} onChangeText={(v) => onChange(row.key, "reps", v)} keyboardType="numeric" mode="outlined" style={styles.fieldSmall} dense />
      <TextInput label="kg" value={row.weightKg} onChangeText={(v) => onChange(row.key, "weightKg", v)} keyboardType="decimal-pad" mode="outlined" style={styles.fieldSmall} dense />
    </View>
  );
}

function BodyweightFields({ row, index, onChange }: RowFieldsProps) {
  return (
    <View style={styles.rowFields}>
      <Text style={styles.setLabel}>Set {index + 1}</Text>
      <TextInput label="Reps" value={row.reps} onChangeText={(v) => onChange(row.key, "reps", v)} keyboardType="numeric" mode="outlined" style={styles.fieldMedium} dense />
    </View>
  );
}

function TimedFields({ row, index, onChange }: RowFieldsProps) {
  return (
    <View style={styles.rowFields}>
      <Text style={styles.setLabel}>Set {index + 1}</Text>
      <TextInput label="Duration (sec)" value={row.durationSecs} onChangeText={(v) => onChange(row.key, "durationSecs", v)} keyboardType="numeric" mode="outlined" style={styles.fieldMedium} dense />
    </View>
  );
}

function RunningFields({ row, onChange }: Omit<RowFieldsProps, "index">) {
  return (
    <View style={{ flex: 1, gap: 8 }}>
      <TextInput label="Distance (km)" value={row.distanceKm} onChangeText={(v) => onChange(row.key, "distanceKm", v)} keyboardType="decimal-pad" mode="outlined" dense />
      <View style={styles.rowFields}>
        <TextInput label="min" value={row.durationMins} onChangeText={(v) => onChange(row.key, "durationMins", v)} keyboardType="numeric" mode="outlined" style={styles.fieldSmall} dense />
        <TextInput label="sec" value={row.durationSecs} onChangeText={(v) => onChange(row.key, "durationSecs", v)} keyboardType="numeric" mode="outlined" style={styles.fieldSmall} dense />
      </View>
    </View>
  );
}

function FreestyleFields({ row, onChange }: Omit<RowFieldsProps, "index">) {
  return (
    <View style={styles.rowFields}>
      <TextInput label="Duration (min)" value={row.durationMins} onChangeText={(v) => onChange(row.key, "durationMins", v)} keyboardType="numeric" mode="outlined" style={styles.fieldSmall} dense />
      <TextInput label="Duration (sec)" value={row.durationSecs} onChangeText={(v) => onChange(row.key, "durationSecs", v)} keyboardType="numeric" mode="outlined" style={styles.fieldMedium} dense />
    </View>
  );
}

// ── Climbing UI ───────────────────────────────────────────────────────────────

type ClimbingUIProps = {
  sessionMins: string;
  sessionSecs: string;
  onSessionMinsChange: (v: string) => void;
  onSessionSecsChange: (v: string) => void;
  routes: ClimbingRoute[];
  onAddRoute: () => void;
  onRemoveRoute: (key: string) => void;
  onDeleteExisting: (routeId: string) => void;
  onRouteChange: (key: string, field: keyof ClimbingRoute, value: string | boolean) => void;
};

function ClimbingUI({
  sessionMins, sessionSecs, onSessionMinsChange, onSessionSecsChange,
  routes, onAddRoute, onRemoveRoute, onDeleteExisting, onRouteChange,
}: ClimbingUIProps) {
  const theme = useTheme();

  return (
    <>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 6 }}>
        Session duration
      </Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <TextInput label="min" value={sessionMins} onChangeText={onSessionMinsChange} keyboardType="numeric" mode="outlined" style={{ flex: 1 }} dense />
        <TextInput label="sec" value={sessionSecs} onChangeText={onSessionSecsChange} keyboardType="numeric" mode="outlined" style={{ flex: 1 }} dense />
      </View>

      <Text variant="titleSmall" style={{ color: theme.colors.onBackground, marginBottom: 8 }}>
        Routes
      </Text>

      {routes.map((route, i) => (
        <View key={route.key}>
          <View style={styles.climbingRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <Text style={styles.setLabel}>Route {i + 1}</Text>
                {!route.isNew && (
                  <Chip compact style={{ backgroundColor: theme.colors.secondaryContainer }}>
                    <Text style={{ fontSize: 10, color: theme.colors.onSecondaryContainer }}>saved</Text>
                  </Chip>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {V_GRADES.map((grade) => (
                    <Chip
                      key={grade}
                      selected={route.difficulty === grade}
                      onPress={() => onRouteChange(route.key, "difficulty", grade)}
                      compact
                      style={{
                        backgroundColor: route.difficulty === grade
                          ? theme.colors.primary
                          : theme.colors.surfaceVariant,
                      }}
                      textStyle={{
                        color: route.difficulty === grade
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant,
                        fontSize: 11,
                      }}
                    >
                      {grade}
                    </Chip>
                  ))}
                </View>
              </ScrollView>

              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput
                  label="Attempts"
                  value={route.attempts}
                  onChangeText={(v) => onRouteChange(route.key, "attempts", v)}
                  keyboardType="numeric"
                  mode="outlined"
                  style={{ width: 90 }}
                  dense
                />
                <SegmentedButtons
                  value={route.completed ? "yes" : "no"}
                  onValueChange={(v) => onRouteChange(route.key, "completed", v === "yes")}
                  style={{ flex: 1 }}
                  buttons={[
                    { value: "yes", label: "Completed" },
                    { value: "no", label: "Attempted" },
                  ]}
                />
              </View>
            </View>

            <IconButton
              icon="trash-can-outline"
              size={20}
              iconColor={theme.colors.error}
              onPress={() =>
                route.isNew
                  ? onRemoveRoute(route.key)
                  : onDeleteExisting(route.key)
              }
            />
          </View>
          {i < routes.length - 1 && <Divider style={{ marginVertical: 8 }} />}
        </View>
      ))}

      <Button mode="outlined" icon="plus" onPress={onAddRoute} style={{ marginTop: 8 }}>
        Add route
      </Button>
    </>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function LogEntriesScreen() {
  const theme = useTheme();
  const navigation = useNavigation<LogEntriesNavProp>();
  const route = useRoute<LogEntriesRouteProp>();
  const { state } = useAuth();
  const token = state.status === "authenticated" ? state.token : "";

  const { workoutId, weId, exerciseName, trackingType, existingRoutes, existingEntries } = route.params;

  console.log("existingEntries", existingEntries)
  const isSessionBased = trackingType === "running" || trackingType === "freestyle";
  const isClimbing = trackingType === "climbing";

  const [rows, setRows] = useState<SetRow[]>(() => {
    if (!isClimbing && existingEntries && existingEntries.length > 0) {
      return existingEntries.map((e) => ({
        key: String(e.id),
        entryId: e.id,
        reps: e.reps != null ? String(e.reps) : "",
        weightKg: e.weightKg != null ? String(e.weightKg) : "",
        durationMins: e.durationSecs != null ? String(Math.floor(e.durationSecs / 60)) : "",
        durationSecs: e.durationSecs != null ? String(e.durationSecs % 60) : "",
        distanceKm: e.distanceKm != null ? String(e.distanceKm) : "",
      }));
    }
    return [emptySet()];
  });

  const [climbingRoutes, setClimbingRoutes] = useState<ClimbingRoute[]>(() => {
    if (existingRoutes && existingRoutes.length > 0) {
      return existingRoutes.map((r) => ({
        key: r.id,
        difficulty: r.difficulty,
        completed: r.completed,
        attempts: String(r.attempts),
        isNew: false,
      }));
    }
    return [emptyRoute()];
  });

  const existingDuration = existingEntries?.find((e) => e.durationSecs != null)?.durationSecs ?? 0;

  console.log("existingDuration", existingDuration)
  const [sessionMins, setSessionMins] = useState(
    existingDuration > 0 ? String(Math.floor(existingDuration / 60)) : ""
  );

  console.log("sessionMins", sessionMins)
  const [sessionSecs, setSessionSecs] = useState(
    existingDuration > 0 ? String(existingDuration % 60) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(key: string, field: keyof SetRow, value: string) {
    setRows((prev) => prev.map((r) => r.key === key ? { ...r, [field]: value } : r));
  }

  function handleRouteChange(key: string, field: keyof ClimbingRoute, value: string | boolean) {
    setClimbingRoutes((prev) => prev.map((r) => r.key === key ? { ...r, [field]: value } : r));
  }

  const handleDeleteExisting = useCallback(async (routeId: string) => {
    try {
      await deleteRoute(token, workoutId, weId, routeId);
      setClimbingRoutes((prev) => prev.filter((r) => r.key !== routeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete route");
    }
  }, [token, workoutId, weId]);

  const handleRemoveRow = useCallback(async (row: SetRow) => {
    if (row.entryId) {
      try {
        await deleteEntry(token, workoutId, weId, row.entryId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete set");
        return;
      }
    }
    setRows((prev) => prev.filter((r) => r.key !== row.key));
  }, [token, workoutId, weId]);
  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (isClimbing) {
        const mins = sessionMins ? parseInt(sessionMins, 10) : 0;
        const secs = sessionSecs ? parseInt(sessionSecs, 10) : 0;
        const durationSecs = (mins * 60 + secs) || undefined;

        if (durationSecs && existingDuration !== durationSecs) {
          await addEntry(token, workoutId, weId, { durationSecs });
        }

        const newRoutes = climbingRoutes.filter((r) => r.isNew && r.difficulty);
        await Promise.all(
          newRoutes.map((r) =>
            addRoute(token, workoutId, weId, {
              difficulty: r.difficulty,
              completed: r.completed,
              attempts: r.attempts ? parseInt(r.attempts, 10) : 1,
            })
          )
        );
      } else {
        const buildData = (row: SetRow) => {
          const data: Parameters<typeof addEntry>[3] = {};
          if (row.reps) data.reps = parseInt(row.reps, 10);
          if (row.weightKg) data.weightKg = parseFloat(row.weightKg);
          if (row.distanceKm) data.distanceKm = parseFloat(row.distanceKm);
          const mins = row.durationMins ? parseInt(row.durationMins, 10) : 0;
          const secs = row.durationSecs ? parseInt(row.durationSecs, 10) : 0;
          const totalSecs = mins * 60 + secs;
          if (totalSecs > 0) data.durationSecs = totalSecs;
          return data;
        };

        const newRows = rows.filter((r) => !r.entryId);
        const existingRows = rows.filter((r) => !!r.entryId);

        await Promise.all(
          newRows.map((row) => addEntry(token, workoutId, weId, buildData(row)))
        );
        await Promise.all(
          existingRows.map((row) => updateEntry(token, workoutId, weId, row.entryId!, buildData(row)))
        );
      }
      navigation.pop(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
        {exerciseName}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 20 }}>
        {isClimbing
          ? "Session duration and routes"
          : isSessionBased
            ? "Log this session"
            : "Log your sets"}
      </Text>

      {error ? (
        <Text style={{ color: theme.colors.error, marginBottom: 12 }}>{error}</Text>
      ) : null}

      <Card mode="elevated" style={{ marginBottom: 16 }}>
        <Card.Content>
          {isClimbing && (
            <ClimbingUI
              sessionMins={sessionMins}
              sessionSecs={sessionSecs}
              onSessionMinsChange={setSessionMins}
              onSessionSecsChange={setSessionSecs}
              routes={climbingRoutes}
              onAddRoute={() => setClimbingRoutes((prev) => [...prev, emptyRoute()])}
              onRemoveRoute={(key) => setClimbingRoutes((prev) => prev.filter((r) => r.key !== key))}
              onDeleteExisting={handleDeleteExisting}
              onRouteChange={handleRouteChange}
            />
          )}

          {!isClimbing && rows.map((row, i) => (
            <View key={row.key}>
              <View style={styles.rowContainer}>
                {trackingType === "strength" && <StrengthFields row={row} index={i} onChange={handleChange} />}
                {trackingType === "bodyweight" && <BodyweightFields row={row} index={i} onChange={handleChange} />}
                {trackingType === "timed" && <TimedFields row={row} index={i} onChange={handleChange} />}
                {trackingType === "running" && <RunningFields row={row} onChange={handleChange} />}
                {trackingType === "freestyle" && <FreestyleFields row={row} onChange={handleChange} />}
                {!isSessionBased && rows.length > 1 && (
                  <IconButton
                    icon="minus-circle-outline"
                    size={20}
                    iconColor={theme.colors.error}
                    onPress={() => handleRemoveRow(row)}
                  />
                )}
              </View>
              {i < rows.length - 1 && <Divider style={{ marginVertical: 4 }} />}
            </View>
          ))}
        </Card.Content>
      </Card>

      {!isSessionBased && !isClimbing && (
        <Button
          mode="outlined"
          icon="plus"
          onPress={() => setRows((prev) => [...prev, emptySet()])}
          style={{ marginBottom: 16 }}
        >
          Add set
        </Button>
      )}

      <View style={styles.actions}>
        <Button mode="outlined" onPress={() => navigation.pop(2)} style={styles.btn} disabled={saving}>
          Skip
        </Button>
        <Button mode="contained" onPress={handleSave} style={styles.btn} loading={saving} disabled={saving}>
          Save
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontWeight: "600", marginBottom: 4 },
  rowContainer: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  rowFields: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  climbingRow: { flexDirection: "row", alignItems: "flex-start" },
  setLabel: { width: 44, fontSize: 12, color: "#888" },
  fieldSmall: { flex: 1 },
  fieldMedium: { flex: 1 },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  btn: { flex: 1 },
});
