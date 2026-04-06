import React, { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Card,
  Chip,
  Searchbar,
  Text,
  useTheme,
} from "react-native-paper";
import { useAuth } from "../auth/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { addExerciseToWorkout, Exercise, listExercises } from "../api/client";
import { AddExerciseNavProp, AddExerciseRouteProp } from "../navigation/types";

const CATEGORY_COLORS: Record<string, string> = {
  strength: "#1B6EF3",
  calisthenics: "#0F6E56",
  sports: "#854F0B",
};

const CATEGORY_FILTERS = ["all", "strength", "calisthenics", "sports"] as const;

export function AddExerciseScreen() {
  const theme = useTheme();
  const { state } = useAuth();
  const token = state.status === "authenticated" ? state.token : "";
  const navigation = useNavigation<AddExerciseNavProp>();
  const route = useRoute<AddExerciseRouteProp>();
  const { workoutId } = route.params;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<typeof CATEGORY_FILTERS[number]>("all");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listExercises();
      setExercises(data);
    } catch {
      // silently fail — list just stays empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = exercises.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || e.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleAdd = useCallback(async (exercise: Exercise) => {
    setAdding(exercise.id);
    try {
      const we = await addExerciseToWorkout(token, workoutId, {
        exerciseId: exercise.id,
        sortOrder: 0,
      });
      // Navigate to log entries for this exercise
      navigation.replace("LogEntries", {
        workoutId,
        weId: we.id,
        exerciseName: exercise.name,
        trackingType: exercise.trackingType,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(null);
    }
  }, [workoutId, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search exercises"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      <View style={styles.filters}>
        {CATEGORY_FILTERS.map((c) => (
          <Chip
            key={c}
            selected={category === c}
            onPress={() => setCategory(c)}
            style={styles.filterChip}
            compact
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </Chip>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" animating />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const color = CATEGORY_COLORS[item.category] ?? theme.colors.primary;
            const isAdding = adding === item.id;

            return (
              <Card
                style={styles.card}
                mode="elevated"
                onPress={() => !adding && handleAdd(item)}
              >
                <Card.Content style={styles.cardContent}>
                  <View style={{ flex: 1 }}>
                    <Text
                      variant="titleSmall"
                      style={{ color: theme.colors.onSurface }}
                    >
                      {item.name}
                    </Text>
                    <View style={styles.chipRow}>
                      <Chip
                        compact
                        style={{ backgroundColor: color + "22" }}
                        textStyle={{ color, fontSize: 11 }}
                      >
                        {item.category}
                      </Chip>
                      <Chip
                        compact
                        style={{ backgroundColor: theme.colors.surfaceVariant }}
                        textStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
                      >
                        {item.trackingType}
                      </Chip>
                      {item.muscleGroup ? (
                        <Chip
                          compact
                          style={{ backgroundColor: theme.colors.surfaceVariant }}
                          textStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
                        >
                          {item.muscleGroup}
                        </Chip>
                      ) : null}
                    </View>
                  </View>
                  {isAdding && <ActivityIndicator size={18} animating />}
                </Card.Content>
              </Card>
            );
          }}
          contentContainerStyle={filtered.length === 0 ? styles.centered : styles.list}
          ListEmptyComponent={
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              No exercises found.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  search: { margin: 16, marginBottom: 8 },
  filters: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  filterChip: {},
  list: { padding: 16 },
  card: { marginBottom: 10 },
  cardContent: { flexDirection: "row", alignItems: "center" },
  chipRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
});
