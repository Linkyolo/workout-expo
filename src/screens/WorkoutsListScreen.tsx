import React, { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Banner,
  Card,
  Chip,
  FAB,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";
import { useAuth } from "../auth/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { deleteWorkout, listWorkouts, Workout } from "../api/client";
import { WorkoutsListNavProp } from "../navigation/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type WorkoutCardProps = {
  workout: Workout;
  onDelete: (id: string) => void;
};

function WorkoutCard({ workout, onDelete }: WorkoutCardProps) {
  const theme = useTheme();
  const { state, logout } = useAuth();
  const token = state.status === "authenticated" ? state.token : "";
  const navigation = useNavigation<WorkoutsListNavProp>();

  return (
    <Card
      style={styles.card}
      mode="elevated"
      onPress={() =>
        navigation.navigate("WorkoutDetail", {
          workoutId: workout.id,
          workoutName: workout.name,
        })
      }
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
            {workout.name}
          </Text>
          <IconButton
            icon="pencil-outline"
            size={18}
            onPress={() =>
              navigation.navigate("EditWorkout", {
                workoutId: workout.id,
                name: workout.name,
                performedOn: workout.performedOn,
                notes: workout.notes,
              })
            }
          />
          <IconButton
            icon="trash-can-outline"
            size={18}
            iconColor={theme.colors.error}
            onPress={() => onDelete(workout.id)}
          />
        </View>

        <Chip
          compact
          icon="calendar"
          style={{ backgroundColor: theme.colors.secondaryContainer, alignSelf: "flex-start" }}
          textStyle={{ color: theme.colors.onSecondaryContainer, fontSize: 12 }}
        >
          {formatDate(workout.performedOn)}
        </Chip>

        {workout.notes ? (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}
            numberOfLines={2}
          >
            {workout.notes}
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );
}

export function WorkoutsListScreen() {
  const theme = useTheme();
  const { state, logout } = useAuth();
  const token = state.status === "authenticated" ? state.token : "";
  const navigation = useNavigation<WorkoutsListNavProp>();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const data = await listWorkouts({ token: token });
      setWorkouts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Set logout button in header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon="logout"
          size={20}
          onPress={logout}
        />
      ),
    });
  }, [navigation, logout]);

  // Reload when navigating back to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => load());
    return unsubscribe;
  }, [navigation, load]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteWorkout(token, id);
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
    } catch {
      setError("Failed to delete workout");
    }
  }, []);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" animating />
        <Text variant="bodyMedium" style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>
          Loading workouts…
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Banner
        visible={error !== null}
        actions={[
          { label: "Retry", onPress: () => load() },
          { label: "Dismiss", onPress: () => setError(null) },
        ]}
        icon="alert-circle-outline"
      >
        {error ?? ""}
      </Banner>

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WorkoutCard workout={item} onDelete={handleDelete} />
        )}
        contentContainerStyle={
          workouts.length === 0 ? styles.emptyContainer : styles.list
        }
        onRefresh={() => load(true)}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              No workouts yet.
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              Tap + to log your first session.
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate("CreateWorkout")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  list: { padding: 16, paddingBottom: 88 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  card: { marginBottom: 12 },
  fab: { position: "absolute", right: 16, bottom: 24 },
});
