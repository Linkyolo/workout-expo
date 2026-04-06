import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	AuthenticationDetails,
	CognitoRefreshToken,
	CognitoUser,
	CognitoUserAttribute,
	CognitoUserPool,
	ISignUpResult,
} from "amazon-cognito-identity-js";
import * as SecureStore from "expo-secure-store";
import { setSessionExpiredHandler } from "../api/client";

// ── Cognito config ────────────────────────────────────────────────────────────

const USER_POOL_ID = process.env.EXPO_PUBLIC_USER_POOL_ID!;
const CLIENT_ID = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID!;
const API_BASE = process.env.EXPO_PUBLIC_API_BASE!;

// client.ts
const ID_TOKEN_KEY = "workout_id_token";
const REFRESH_TOKEN_KEY = "workout_refresh_token";
const USERNAME_KEY = "workout_username";

const userPool = new CognitoUserPool({
	UserPoolId: USER_POOL_ID,
	ClientId: CLIENT_ID,
});

// ── JWT helper ────────────────────────────────────────────────────────────────

function isTokenExpired(token: string): boolean {
	try {
		const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
		const payload = JSON.parse(atob(base64));
		return payload.exp * 1000 < Date.now() + 60_000;
	} catch {
		return true;
	}
}

// ── Cognito helpers ───────────────────────────────────────────────────────────

function cognitoLogin(
	email: string,
	password: string
): Promise<{ idToken: string; refreshToken: string }> {
	return new Promise((resolve, reject) => {
		const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
		const authDetails = new AuthenticationDetails({ Username: email, Password: password });

		cognitoUser.authenticateUser(authDetails, {
			onSuccess(session) {
				resolve({
					idToken: session.getIdToken().getJwtToken(),
					refreshToken: session.getRefreshToken().getToken(),
				});
			},
			onFailure(err) {
				reject(new Error(err.message ?? "Login failed"));
			},
			newPasswordRequired() {
				reject(new Error("Password reset required"));
			},
		});
	});
}

function cognitoRegister(
	email: string,
	password: string,
	displayName: string
): Promise<ISignUpResult> {
	return new Promise((resolve, reject) => {
		const attributes = [
			new CognitoUserAttribute({ Name: "email", Value: email }),
			new CognitoUserAttribute({ Name: "name", Value: displayName }),
		];

		userPool.signUp(email, password, attributes, [], (err, result) => {
			if (err || !result) {
				reject(new Error(err?.message ?? "Registration failed"));
			} else {
				resolve(result);
			}
		});
	});
}

function cognitoConfirm(email: string, code: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

		cognitoUser.confirmRegistration(code, true, (err) => {
			if (err) {
				reject(new Error(err.message ?? "Confirmation failed"));
			} else {
				resolve();
			}
		});
	});
}

function refreshIdToken(username: string, refreshToken: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const cognitoUser = new CognitoUser({ Username: username, Pool: userPool });
		const token = new CognitoRefreshToken({ RefreshToken: refreshToken });

		cognitoUser.refreshSession(token, (err, session) => {
			if (err) reject(new Error(err.message ?? "Token refresh failed"));
			else resolve(session.getIdToken().getJwtToken());
		});
	});
}

// ── Context types ─────────────────────────────────────────────────────────────

type AuthState =
	| { status: "loading" }
	| { status: "unauthenticated" }
	| { status: "authenticated"; token: string };

type AuthContextValue = {
	state: AuthState;
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	refreshToken: () => Promise<string | null>;
	register: (email: string, password: string, displayName: string) => Promise<void>;
	confirmEmail: (email: string, code: string) => Promise<void>;
};

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<AuthState>({ status: "loading" });

	const logout = useCallback(async () => {
		await Promise.all([
			SecureStore.deleteItemAsync(ID_TOKEN_KEY),
			SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
			SecureStore.deleteItemAsync(USERNAME_KEY),
		]);
		setState({ status: "unauthenticated" });
	}, []);

	const refreshToken = useCallback(async (): Promise<string | null> => {
		try {
			const [storedRefresh, username] = await Promise.all([
				SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
				SecureStore.getItemAsync(USERNAME_KEY),
			]);
			if (!storedRefresh || !username) return null;

			const newIdToken = await refreshIdToken(username, storedRefresh);
			await SecureStore.setItemAsync(ID_TOKEN_KEY, newIdToken);
			setState({ status: "authenticated", token: newIdToken });
			return newIdToken;
		} catch {
			await logout();
			return null;
		}
	}, [logout]);

	useEffect(() => {
		setSessionExpiredHandler(async () => {
			const newToken = await refreshToken();
			if (!newToken) logout();
			return newToken;
		});
	}, [refreshToken, logout]);

	// On mount — restore session from secure storage
	useEffect(() => {
		(async () => {
			try {
				const idToken = await SecureStore.getItemAsync(ID_TOKEN_KEY);

				if (!idToken) {
					setState({ status: "unauthenticated" });
					return;
				}

				if (!isTokenExpired(idToken)) {
					setState({ status: "authenticated", token: idToken });
					return;
				}

				const newToken = await refreshToken();
				if (!newToken) setState({ status: "unauthenticated" });
			} catch {
				setState({ status: "unauthenticated" });
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		const { idToken, refreshToken: rt } = await cognitoLogin(email, password);

		await Promise.all([
			SecureStore.setItemAsync(ID_TOKEN_KEY, idToken),
			SecureStore.setItemAsync(REFRESH_TOKEN_KEY, rt),
			SecureStore.setItemAsync(USERNAME_KEY, email),
		]);

		setState({ status: "authenticated", token: idToken });

		// Upsert user row in Neon — fire and forget
		fetch(`${API_BASE}/users/me`, {
			method: "POST",
			headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
			body: JSON.stringify({}),
		}).catch(() => { });
	}, []);

	// Calls Cognito signUp — does NOT log in, user must confirm email first
	const register = useCallback(async (
		email: string,
		password: string,
		displayName: string,
	) => {
		await cognitoRegister(email, password, displayName);
		// After this the user is redirected to ConfirmEmailScreen
		// Cognito sends the verification code automatically
	}, []);

	// Confirms the verification code — after this the user can log in
	const confirmEmail = useCallback(async (email: string, code: string) => {
		await cognitoConfirm(email, code);
		// After confirmation the user is redirected to LoginScreen
	}, []);

	return (
		<AuthContext.Provider value={{ state, login, logout, refreshToken, register, confirmEmail }}>
			{children}
		</AuthContext.Provider>
	);
}
