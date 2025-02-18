// LoginForm.ts
import { AuthService } from '../../lib/services/auth/auth.service';
import { UserService } from '../../lib/services/user/user.service';
import type { AuthCredentials } from '../../lib/models/auth';
import { UserRole, type User } from '../../lib/models/user';
import { PonenciaService } from '../../lib/services/ponencias/ponencia.service';

export class LoginForm {
  private authService: AuthService;
  private userService: UserService;
  private ponenciaService: PonenciaService;
  private form: HTMLFormElement | null;
  private googleButton: HTMLButtonElement | null;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
    this.ponenciaService = new PonenciaService();
    this.form = null;
    this.googleButton = null;
    this.attachListeners();
  }

  private async getRedirectUrl(userData: User): Promise<string> {
    const routes: Record<UserRole, string> = {
      [UserRole.ADMIN]: '/admin/vistaAdmin',
      [UserRole.REVISOR]: '/revisor/revisor',
      [UserRole.ESCRITOR]: '/escritor/escritor',
      [UserRole.MODERADOR]: '/moderador/salasMod',
      [UserRole.PONENTE]: '/ponente/dashboardPonencia'
    };

    // Special handling for PONENTE role
    if (userData.rol === UserRole.PONENTE) {
      try {
        const ponencia = await this.ponenciaService.getPonenciaById(userData.uid);
        return ponencia ? '/ponente/registroValido' : '/ponente/datosPonencia';
      } catch (error) {
        console.error('Error al verificar ponencia:', error);
        return '/ponente/datosPonencia';
      }
    }

    return routes[userData.rol] || '/autenticacion/iniciarSesion';
  }

  async handleSubmit(credentials: AuthCredentials): Promise<void> {
    try {
      // Login con Firebase
      const { user: firebaseUser } = await this.authService.login(credentials);
      
      await new Promise<void>((resolve) => {
        const unsubscribe = this.authService.onAuthStateChanged((user) => {
          if (user) {
            unsubscribe();
            resolve();
          }
        });
      });

      // Obtener datos completos del usuario
      const userData = await this.userService.getUserById(firebaseUser.uid);
      
      // Obtener URL de redirección basada en el rol y estado de ponencia
      const redirectUrl = await this.getRedirectUrl(userData);
      window.location.href = redirectUrl;

    } catch (error) {
      console.error('Error en inicio de sesión:', error);
      throw this.authService.handleAuthError(error);
    }
  }

  private async handleGoogleLogin(e: Event): Promise<void> {
    e.preventDefault();
    try {
      const { user: firebaseUser } = await this.authService.loginWithGoogle();
      
      await new Promise<void>((resolve) => {
        const unsubscribe = this.authService.onAuthStateChanged((user) => {
          if (user) {
            unsubscribe();
            resolve();
          }
        });
      });

      // Obtener datos completos del usuario
      const userData = await this.userService.getUserById(firebaseUser.uid);
      
      // Usar la misma lógica de redirección que el login normal
      const redirectUrl = await this.getRedirectUrl(userData);
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Error en inicio de sesión con Google:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(errorMessage);
    }
  }

  attachListeners(): void {
    this.form = document.getElementById('loginForm') as HTMLFormElement;
    this.googleButton = document.querySelector('.google-btn') as HTMLButtonElement;
    
    if (!this.form || !this.googleButton) {
      throw new Error('No se encontraron los elementos necesarios en el DOM');
    }

    this.form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;
      
      try {
        await this.handleSubmit({ email, password });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        alert(errorMessage);
      }
    });

    this.googleButton?.addEventListener('click', this.handleGoogleLogin.bind(this));
  }
}

// Inicializar el formulario
const loginForm = new LoginForm();