// src/components/auth/LoginForm.ts
import { AuthService } from '../../lib/services/auth/auth.service';
import { UserService } from '../../lib/services/user/user.service';
import type { AuthCredentials } from '../../lib/models/auth';
import { UserRole } from '../../lib/models/user';

export class LoginForm {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  async handleSubmit(credentials: AuthCredentials): Promise<void> {
    try {
      // Login con Firebase
      const { user: firebaseUser } = await this.authService.login(credentials);
      
      // Obtener datos completos del usuario
      const userData = await this.userService.getUserById(firebaseUser.uid);
      
      // Redirigir según el rol
      const routes: Record<UserRole, string> = {
        [UserRole.PONENTE]: '/ponente/registroValido',
        [UserRole.ADMIN]: '/administrador/vistaAdmin',
        [UserRole.REVISOR]: '/revisor/revisor',
        [UserRole.ESCRITOR]: '/escritor/escritor',
        [UserRole.MODERADOR]: '/moderador/moderador'
      };
      const redirectUrl = routes[userData.rol] || '/autenticacion/iniciarSesion';
      window.location.href = redirectUrl;

    } catch (error) {
      console.error('Error en inicio de sesión:', error);
      throw this.authService.handleAuthError(error);
    }
  }

  attachListeners(): void {
    const form = document.getElementById('loginForm') as HTMLFormElement;
    
    form?.addEventListener('submit', async (e) => {
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
  }
}

// Inicializar el formulario
const loginForm = new LoginForm();
loginForm.attachListeners();