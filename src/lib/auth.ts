// Authentication management with persistence
interface AuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
  token: string | null;
}

const AUTH_STORAGE_KEY = 'warranty_dashboard_auth';

export class AuthManager {
  private static instance: AuthManager;
  private authState: AuthState = {
    isAuthenticated: false,
    userEmail: null,
    token: null
  };

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if token is still valid (basic check)
        if (parsed.token && parsed.userEmail && this.isValidEmail(parsed.userEmail)) {
          this.authState = parsed;
        } else {
          this.clearAuth();
        }
      }
    } catch (error) {
      console.error('Failed to load auth from storage:', error);
      this.clearAuth();
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.authState));
    } catch (error) {
      console.error('Failed to save auth to storage:', error);
    }
  }

  private isValidEmail(email: string): boolean {
    return email.endsWith('@galaxyinc.in');
  }

  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  authenticate(credential: string): { success: boolean; message: string } {
    try {
      const payload = this.parseJwt(credential);
      const email = payload && payload.email ? String(payload.email).toLowerCase() : '';
      
      if (!email) {
        return { success: false, message: 'Invalid token' };
      }

      if (!this.isValidEmail(email)) {
        return { success: false, message: 'Access denied. Use your @galaxyinc.in account' };
      }

      this.authState = {
        isAuthenticated: true,
        userEmail: email,
        token: credential
      };

      this.saveToStorage();
      return { success: true, message: 'Authentication successful' };
    } catch (err) {
      return { success: false, message: 'Authentication failed. Please try again.' };
    }
  }

  logout(): void {
    this.clearAuth();
  }

  private clearAuth(): void {
    this.authState = {
      isAuthenticated: false,
      userEmail: null,
      token: null
    };
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear auth from storage:', error);
    }
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  getUserEmail(): string | null {
    return this.authState.userEmail;
  }

  getToken(): string | null {
    return this.authState.token;
  }
}

export const authManager = AuthManager.getInstance();
