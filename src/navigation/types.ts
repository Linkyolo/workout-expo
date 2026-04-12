import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";

// ── Unauthenticated stack ─────────────────────────────────────────────────────

export type UnauthStackParamList = {
	Login: undefined;
	Register: undefined;
	ConfirmEmail: { email: string };
};

export type LoginNavProp = NativeStackNavigationProp<UnauthStackParamList, "Login">;
export type RegisterNavProp = NativeStackNavigationProp<UnauthStackParamList, "Register">;
export type ConfirmEmailNavProp = NativeStackNavigationProp<UnauthStackParamList, "ConfirmEmail">;
export type ConfirmEmailRouteProp = RouteProp<UnauthStackParamList, "ConfirmEmail">;

// ── Authenticated stack ───────────────────────────────────────────────────────

export type ExistingRoute = {
	id: string;
	difficulty: string;
	completed: boolean;
	attempts: number;
};

export type ExistingEntry = {
	id: string;
	durationSecs: number | null;
	distanceKm: string | null;
	reps: number | null;
	weightKg: string | null;
};

export type RootStackParamList = {
	WorkoutsList: undefined;
	WorkoutDetail: { workoutId: string; workoutName: string };
	CreateWorkout: undefined;
	EditWorkout: { workoutId: string; name: string; performedOn: string; notes: string | null };
	AddExercise: { workoutId: string };
	LogEntries: {
		workoutId: string;
		weId: string;
		exerciseName: string;
		trackingType: string;
		existingRoutes?: ExistingRoute[];
		existingEntries?: ExistingEntry[];
	};
};

export type WorkoutsListNavProp = NativeStackNavigationProp<RootStackParamList, "WorkoutsList">;
export type WorkoutDetailNavProp = NativeStackNavigationProp<RootStackParamList, "WorkoutDetail">;
export type CreateWorkoutNavProp = NativeStackNavigationProp<RootStackParamList, "CreateWorkout">;
export type EditWorkoutNavProp = NativeStackNavigationProp<RootStackParamList, "EditWorkout">;
export type AddExerciseNavProp = NativeStackNavigationProp<RootStackParamList, "AddExercise">;
export type LogEntriesNavProp = NativeStackNavigationProp<RootStackParamList, "LogEntries">;

export type WorkoutDetailRouteProp = RouteProp<RootStackParamList, "WorkoutDetail">;
export type EditWorkoutRouteProp = RouteProp<RootStackParamList, "EditWorkout">;
export type AddExerciseRouteProp = RouteProp<RootStackParamList, "AddExercise">;
export type LogEntriesRouteProp = RouteProp<RootStackParamList, "LogEntries">;
