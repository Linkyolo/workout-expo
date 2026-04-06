const API_BASE = process.env.EXPO_PUBLIC_API_BASE!;


// ── Session expiry callback ───────────────────────────────────────────────────
// Returns the new token after refresh, or null if refresh failed (logout).
let onSessionExpired: (() => Promise<string | null>) | null = null;

export function setSessionExpiredHandler(handler: () => Promise<string | null>) {
	onSessionExpired = handler;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type Workout = {
	id: string;
	name: string;
	performedOn: string;
	notes: string | null;
	createdAt: string;
};

export type Exercise = {
	id: string;
	name: string;
	category: "strength" | "calisthenics" | "sports";
	trackingType: string;
	muscleGroup: string | null;
};

export type WorkoutExercise = {
	id: string;
	sortOrder: number;
	exercise: Exercise;
	entries: Entry[];
	climbingRoutes: ClimbingRouteSummary[];
};

export type ClimbingRouteSummary = {
	id: string;
	difficulty: string;
	completed: boolean;
	attempts: number;
};

export type Entry = {
	id: string;
	entryNumber: number;
	reps: number | null;
	weightKg: string | null;
	durationSecs: number | null;
	distanceKm: string | null;
};

export type WorkoutDetail = Workout & {
	workoutExercises: WorkoutExercise[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function request<T>(
	path: string,
	token: string,
	options: RequestInit = {},
	isRetry = false
): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
			...options.headers,
		},
	});

	if (res.status === 401 && !isRetry) {
		// Try to refresh the token silently
		const newToken = await onSessionExpired?.();
		if (newToken) {
			// Retry the original request with the fresh token
			return request<T>(path, newToken, options, true);
		}
		throw new Error("Session expired — please log in again");
	}

	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.message ?? `HTTP ${res.status}`);
	}

	if (res.status === 204) return undefined as T;
	return res.json();
}

// ── Workouts ──────────────────────────────────────────────────────────────────

export async function listWorkouts({
	token,
	from,
	to,
	limit = 20,
	offset = 0,
}: {
	token: string;
	from?: string;
	to?: string;
	limit?: number;
	offset?: number;
}): Promise<Workout[]> {
	const params = new URLSearchParams({
		limit: String(limit),
		offset: String(offset),
		...(from && { from }),
		...(to && { to }),
	});
	return request<Workout[]>(`/workouts?${params}`, token);
}

export async function getWorkout(token: string, workoutId: string): Promise<WorkoutDetail> {
	return request<WorkoutDetail>(`/workouts/${workoutId}`, token);
}

export async function createWorkout(
	token: string,
	data: { name: string; performedOn: string; notes?: string }
): Promise<Workout> {
	return request<Workout>("/workouts", token, {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function updateWorkout(
	token: string,
	workoutId: string,
	data: { name?: string; performedOn?: string; notes?: string }
): Promise<Workout> {
	return request<Workout>(`/workouts/${workoutId}`, token, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function deleteWorkout(token: string, workoutId: string): Promise<void> {
	return request<void>(`/workouts/${workoutId}`, token, { method: "DELETE" });
}

// ── Exercise catalogue (public — no token needed) ─────────────────────────────

export async function listExercises(params?: {
	category?: string;
	tracking_type?: string;
}): Promise<Exercise[]> {
	const query = new URLSearchParams(
		Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v))
	);
	const res = await fetch(`${API_BASE}/exercises?${query}`, {
		headers: { "Content-Type": "application/json" },
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json();
}

// ── Workout exercises ─────────────────────────────────────────────────────────

export async function addExerciseToWorkout(
	token: string,
	workoutId: string,
	data: { exerciseId: string; sortOrder?: number }
): Promise<WorkoutExercise> {
	return request<WorkoutExercise>(`/workouts/${workoutId}/exercises`, token, {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function removeExerciseFromWorkout(
	token: string,
	workoutId: string,
	weId: string
): Promise<void> {
	return request<void>(`/workouts/${workoutId}/exercises/${weId}`, token, {
		method: "DELETE",
	});
}

// ── Entries ───────────────────────────────────────────────────────────────────

export async function addEntry(
	token: string,
	workoutId: string,
	weId: string,
	data: {
		reps?: number;
		weightKg?: number;
		durationSecs?: number;
		distanceKm?: number;
	}
): Promise<Entry> {
	return request<Entry>(
		`/workouts/${workoutId}/exercises/${weId}/entries`,
		token,
		{ method: "POST", body: JSON.stringify(data) }
	);
}

// ── Climbing routes ───────────────────────────────────────────────────────────

export async function addRoute(
	token: string,
	workoutId: string,
	weId: string,
	data: {
		difficulty: string;
		completed?: boolean;
		attempts?: number;
	}
): Promise<void> {
	return request<void>(
		`/workouts/${workoutId}/exercises/${weId}/routes`,
		token,
		{ method: "POST", body: JSON.stringify(data) }
	);
}

export async function deleteRoute(
	token: string,
	workoutId: string,
	weId: string,
	routeId: string
): Promise<void> {
	return request<void>(
		`/workouts/${workoutId}/exercises/${weId}/routes/${routeId}`,
		token,
		{ method: "DELETE" }
	);
}
