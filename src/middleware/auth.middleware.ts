// src/middleware/auth.middleware.ts
import type { User, UserRole } from '../lib/models/user';
import { AuthService } from '../lib/services/auth/auth.service';
import { UserService } from '../lib/services/user/user.service';
import type { User as FirebaseUser } from 'firebase/auth';

export class AuthMiddleware {
  private static instance: AuthMiddleware;
  private authService: AuthService;


  private constructor() {
    this.authService = new AuthService();
  }

  public static getInstance(): AuthMiddleware {
    if (!AuthMiddleware.instance) {
      AuthMiddleware.instance = new AuthMiddleware();
    }
    return AuthMiddleware.instance;
  }

  async checkAuth(requiredRoles?: UserRole[]): Promise<boolean> {
    return new Promise((resolve) => {
      this.authService.onAuthStateChanged(async (user) => {
        if (!user) {
          this.redirectToLogin();
          return resolve(false);
        }

        if (requiredRoles?.length) {
          const hasRole = await this.checkRole(user, requiredRoles);
          if (!hasRole) {
            this.redirectToUnauthorized();
            return resolve(false);
          }
        }

        resolve(true);
      });
    });
  }

  private async checkRole(firebaseUser: FirebaseUser, requiredRoles: string[]): Promise<boolean> {
    try {
      const userService = new UserService();
      const userData = await userService.getUserById(firebaseUser.uid);
      return requiredRoles.includes(userData.rol);
    } catch (error) {
      console.error('Error al verificar rol:', error);
      return false;
    }
  }

  private redirectToLogin(): void {
    window.location.href = '/login';
  }

  private redirectToUnauthorized(): void {
    window.location.href = '/unauthorized';
  }
}