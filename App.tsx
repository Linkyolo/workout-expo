import React from "react";
import Constants from 'expo-constants';

import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useColorScheme, View } from "react-native";
import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import {
  RootStackParamList,
  UnauthStackParamList
} from "./src/navigation/types";

// ── Screens ───────────────────────────────────────────────────────────────────
import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { ConfirmEmailScreen } from "./src/screens/ConfirmEmailScreen";
import { WorkoutsListScreen } from "./src/screens/WorkoutsListScreen";
import { WorkoutDetailScreen } from "./src/screens/WorkoutDetailScreen";
import { CreateWorkoutScreen } from "./src/screens/CreateWorkoutScreen";
import { EditWorkoutScreen } from "./src/screens/EditWorkoutScreen";
import { AddExerciseScreen } from "./src/screens/AddExerciseScreen";
import { LogEntriesScreen } from "./src/screens/LogEntriesScreen";

const UnauthStack = createNativeStackNavigator<UnauthStackParamList>();
const AuthStack = createNativeStackNavigator<RootStackParamList>();

// ── Themes ────────────────────────────────────────────────────────────────────

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#1B6EF3",
    onPrimary: "#FFFFFF",
    primaryContainer: "#D8E2FF",
    onPrimaryContainer: "#001550",
    secondary: "#575E71",
    secondaryContainer: "#DBE2F9",
    onSecondaryContainer: "#141B2C",
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#AFC6FF",
    onPrimary: "#002585",
    primaryContainer: "#0038BA",
    onPrimaryContainer: "#DBE2FF",
    secondary: "#BFC6DC",
    secondaryContainer: "#3F4759",
    onSecondaryContainer: "#DBE2F9",
  },
};

// ── Navigators ────────────────────────────────────────────────────────────────

function UnauthNavigator({ theme }: { theme: typeof lightTheme }) {
  return (
    <NavigationContainer>
      <UnauthStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <UnauthStack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <UnauthStack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: "Create account" }}
        />
        <UnauthStack.Screen
          name="ConfirmEmail"
          component={ConfirmEmailScreen}
          options={{ title: "Confirm email" }}
        />
      </UnauthStack.Navigator>
    </NavigationContainer>
  );
}

function AuthNavigator({ theme }: { theme: typeof lightTheme }) {
  return (
    <NavigationContainer>
      <AuthStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <AuthStack.Screen
          name="WorkoutsList"
          component={WorkoutsListScreen}
          options={{ title: "My workouts" }}
        />
        <AuthStack.Screen
          name="WorkoutDetail"
          component={WorkoutDetailScreen}
          options={({ route }) => ({ title: route.params.workoutName })}
        />
        <AuthStack.Screen
          name="CreateWorkout"
          component={CreateWorkoutScreen}
          options={{ title: "New workout", presentation: "modal" }}
        />
        <AuthStack.Screen
          name="EditWorkout"
          component={EditWorkoutScreen}
          options={{ title: "Edit workout", presentation: "modal" }}
        />
        <AuthStack.Screen
          name="AddExercise"
          component={AddExerciseScreen}
          options={{ title: "Add exercise", presentation: "modal" }}
        />
        <AuthStack.Screen
          name="LogEntries"
          component={LogEntriesScreen}
          options={({ route }) => ({ title: route.params.exerciseName, presentation: "modal" })}
        />
      </AuthStack.Navigator>
    </NavigationContainer>
  );
}

// ── Auth gate ─────────────────────────────────────────────────────────────────

function AppContent({ theme }: { theme: typeof lightTheme }) {
  const { state } = useAuth();

  if (state.status === "loading") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (state.status === "unauthenticated") {
    return <UnauthNavigator theme={theme} />;
  }

  return <AuthNavigator theme={theme} />;
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? darkTheme : lightTheme;
  console.log('CONFIG:', Constants.expoConfig?.extra);
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
          <AppContent theme={theme} />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
