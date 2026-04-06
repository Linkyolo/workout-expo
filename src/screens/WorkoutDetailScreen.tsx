import React, { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Card,
  Chip,
  FAB,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";
import { useAuth } from "../auth/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  getWorkout,
  removeExerciseFromWorkout,
  WorkoutDetail,
  WorkoutExercise,
} from "../api/client";
import { WorkoutDetailNavProp, WorkoutDetailRouteProp } from "../navigation/types";

function formatTracking(we: WorkoutExercise): string {
  if (we.entries.length === 0) return "Tap to log sets";
  const e = we.entries;
  switch (we.exercise.trackingType) {
    case "strength":
      return e.map((s) => `${s.reps} × ${s.weightKg}kg`).join("  ·  ");
    case "bodyweight":
      return e.map((s) => `${s.reps} reps`).join("  ·  ");
    case "timed":
      return e.map((s) => `${s.durationSecs}s`).join("  ·  ");
    case "running":
      return e.map((s) => `${s.distanceKm}km in ${s.durationSecs}s`).join("  ·  ");
    case "freestyle": {
      return e.map((s) => {
        if (!s.durationSecs) return "–";
        const mins = Math.floor(s.durationSecs / 60);
        const secs = s.durationSecs % 60;
        return mins > 0 ? `${mins}min ${secs}s` : `${secs}s`;
      }).join("  ·  ");
    }
    case "climbing": {
      const routes = we.climbingRoutes ?? [];
      if (routes.length === 0) return "Tap to log routes";
      const completed = routes.filter((r) => r.completed).length;
      const grades = routes.map((r) => r.difficulty).join(", ");
      return `${completed}/${routes.length} completed · ${grades}`;
    }
    default:
      return `${e.length} entries`;
  }
}

const categoryColor: Record<string, string> = {
  strength: "#1B6EF3",
  calisthenics: "#0F6E56",
  sports: "#854F0B",
};

type ExerciseCardProps = {
  we: WorkoutExercise;
  workoutId: string;
  onRemove: (weId: string) => void;
};

function ExerciseCard({ we, workoutId, onRemove }: ExerciseCardProps) {
  const theme = useTheme();
  const { state } = useAuth();
  const token = state.status === "authenticated" ? state.token : "";
  const navigation = useNavigation<WorkoutDetailNavProp>();
  const color = categoryColor[we.exercise.category] ?? theme.colors.primary;

  return (
    <Card
      style={styles.card}
      mode="elevated"
      onPress={() =>
        navigation.navigate("LogEntries", {
          workoutId,
          weId: we.id,
          exerciseName: we.exercise.name,
          trackingType: we.exercise.trackingType,
          existingRoutes: we.climbingRoutes,
          existingEntries: we.entries,
        })
      }
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
              {we.exercise.name}
            </Text>
            <View style={styles.chipRow}>
              <Chip
                compact
                style={{ backgroundColor: color + "22", alignSelf: "flex-start" }}
                textStyle={{ color, fontSize: 11 }}
              >
                {we.exercise.category}
              </Chip>
              {we.exercise.muscleGroup ? (
                <Chip
                  compact
                  style={{ backgroundColor: theme.colors.surfaceVariant, alignSelf: "flex-start" }}
                  textStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
                >
                  {we.exercise.muscleGroup}
                </Chip>
              ) : null}
            </View>
          </View>
          <IconButton
            icon="trash-can-outline"
            size={18}
            iconColor={theme.colors.error}
            onPress={(e) => {
              e.stopPropagation();
              onRemove(we.id);
            }}
          />
        </View>
        <Text
          variant="bodySmall"
          style={{
            color: we.entries.length === 0
              ? theme.colors.primary
              : theme.colors.onSurfaceVariant,
            marginTop: 4,
          }}
        >
          {formatTracking(we)}
        </Text>
      </Card.Content>
    </Card>
  );
}

export function WorkoutDetailScreen() {
  const theme = useTheme();
  const { state } = useAuth();
  const token = state.status === "authenticated" ? state.token : "";
  const navigation = useNavigation<WorkoutDetailNavProp>();
  const route = useRoute<WorkoutDetailRouteProp>();
  const { workoutId } = route.params;

  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWorkout(token, workoutId);
      setWorkout(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [workoutId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", load);
    return unsubscribe;
  }, [navigation, load]);

  const handleRemoveExercise = useCallback(async (weId: string) => {
    try {
      await removeExerciseFromWorkout(token, workoutId, weId);
      setWorkout((prev) =>
        prev
          ? { ...prev, workoutExercises: prev.workoutExercises.filter((we) => we.id !== weId) }
          : prev
      );
    } catch {
      setError("Failed to remove exercise");
    }
  }, [workoutId]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" animating />
      </View>
    );
  }

  if (error || !workout) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error }}>{error ?? "Not found"}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={workout.workoutExercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExerciseCard
            we={item}
            workoutId={workoutId}
            onRemove={handleRemoveExercise}
          />
        )}
        contentContainerStyle={
          workout.workoutExercises.length === 0 ? styles.emptyContainer : styles.list
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="headlineSmall" style={{ color: theme.colors.onBackground }}>
              {workout.name}
            </Text>
            {workout.notes ? (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
              >
                {workout.notes}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              No exercises yet.
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              Tap + to add one.
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate("AddExercise", { workoutId })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  list: { padding: 16, paddingBottom: 88 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start" },
  chipRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  card: { marginBottom: 12 },
  fab: { position: "absolute", right: 16, bottom: 24 },
});
