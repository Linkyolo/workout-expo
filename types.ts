import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";

export type RootStackParamList = {
	WorkoutsList: undefined;
	WorkoutDetail: { workoutId: string; workoutName: string };
	CreateWorkout: undefined;
	EditWorkout: { workoutId: string; name: string; performedOn: string; notes: string | null };
	AddExercise: { workoutId: string; weId?: string };
};

export type WorkoutsListNavProp = NativeStackNavigationProp<RootStackParamList, "WorkoutsList">;
export type WorkoutDetailNavProp = NativeStackNavigationProp<RootStackParamList, "WorkoutDetail">;
export type CreateWorkoutNavProp = NativeStackNavigationProp<RootStackParamList, "CreateWorkout">;
export type EditWorkoutNavProp = NativeStackNavigationProp<RootStackParamList, "EditWorkout">;
export type AddExerciseNavProp = NativeStackNavigationProp<RootStackParamList, "AddExercise">;

export type WorkoutDetailRouteProp = RouteProp<RootStackParamList, "WorkoutDetail">;
export type EditWorkoutRouteProp = RouteProp<RootStackParamList, "EditWorkout">;
export type AddExerciseRouteProp = RouteProp<RootStackParamList, "AddExercise">;
