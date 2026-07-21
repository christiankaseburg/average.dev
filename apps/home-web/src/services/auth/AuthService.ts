import { jwtDecode } from 'jwt-decode';
import { config } from '../../config';

export interface User {
  name?: string;
  email?: string;
  id?: string;
  provider?: string;
  issuer?: string;
  audience?: string;
  subject?: string;
}

interface IdTokenClaims {
  sub: string;
  email: string;
  name: string;
  iss: string;
  aud: string; // or string[]
  provider?: string;
  [key: string]: unknown;
}

export class AuthService {
  private static instance: AuthService;
  private user: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];
  private baseUrl = '';

  private constructor() {
    this.baseUrl = config.apiUrl ? config.apiUrl.replace(/\/$/, '') : '';
    // Try to load user from cookie on init
    this.loadUserFromCookie();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private loadUserFromCookie() {
    const idToken = this.getCookie('id_token');
    if (idToken) {
      try {
        const claims = jwtDecode<IdTokenClaims>(idToken);
        // Default to "local" if no provider claim (legacy or standard OIDC doesn't enforce it)
        // But for Azure, we expect the claim or we infer from issuer.
        // My LocalProvider adds "provider": "local".
        // Azure upstream ID token won't have "provider": "azure" typically unless we added it (we didn't).
        let provider = claims.provider;
        if (!provider && claims.iss && claims.iss.includes('accounts.google.com')) {
          provider = 'google';
        }
        if (!provider) {
          provider = 'unknown';
        }

        this.user = {
          id: claims.sub,
          name: claims.name,
          email: claims.email,
          provider: provider,
          issuer: claims.iss,
          audience: Array.isArray(claims.aud) ? claims.aud[0] : claims.aud,
          subject: claims.sub,
        };
      } catch (e) {
        console.error('Failed to decode id_token', e);
        this.user = null;
      }
    }
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;

    return null;
  }

  public async checkSession(): Promise<User | null> {
    // Re-check cookie in case it changed (refresh)
    this.loadUserFromCookie();
    return this.user;
  }

  public setUser(user: User | null) {
    // If setting null (logout), logic matches.
    // If setting user from Me query, we might just want to merge or prefer token?
    // Actually, ID Token is faster (no network). Me Query validates backend session.
    // If Me Query succeeds, it confirms session valid.
    if (user) {
      this.user = { ...this.user, ...user };
    } else {
      this.user = null;
    }
    this.isValidating = false;
    this.notifyListeners();
  }

  // Used by AuthContext to track if we are still checking
  private isValidating = true;
  public isChecking() {
    return this.isValidating;
  }

  public login(returnUrl?: string) {
    if (returnUrl) {
      localStorage.setItem('auth_return_url', returnUrl);
    }
    window.location.href = `http://localhost:8080/auth/login/google`;
  }

  public async refreshToken(): Promise<boolean> {
    if (!this.user || !this.user.provider) return false;

    try {
      const res = await fetch(`${this.baseUrl}/auth/home/${this.user.provider}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include',
      });
      if (res.ok) {
        // Reload cookie to get new ID Token if rotated
        this.loadUserFromCookie();
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      console.error('RefreshToken failed', e);
      return false;
    }
  }

  public async logout(callApi = true) {
    if (callApi) {
      try {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (e) {
        console.error('Logout failed', e);
      }
    }
    localStorage.removeItem('auth_return_url');
    // Clear cookie manually if needed, but httponly makes it hard?
    // Wait, id_token is NOT httponly in my implementation?
    // api/auth.go: c.SetCookie("id_token", idToken, 3600, "/", "", false, true)
    // The last argument `true` is HttpOnly.
    // FAIL: If it is HttpOnly, JS cannot read it.
    // I MUST make id_token NOT HttpOnly if I want to read it on the client.
    // The access_token and refresh_token MUST be HttpOnly.
    // The id_token is safe to expose to JS for UI purposes.

    this.user = null;
    this.notifyListeners();
  }

  public getUser(): User | null {
    return this.user;
  }

  public isAuthenticated(): boolean {
    return !!this.user;
  }

  public subscribe(listener: (user: User | null) => void) {
    this.listeners.push(listener);
    listener(this.user);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l(this.user));
  }
}

export const authService = AuthService.getInstance();
