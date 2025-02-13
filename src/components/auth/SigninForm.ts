// SigninForm.ts
import { AuthService } from '../../lib/services/auth/auth.service';
import { UserService } from '../../lib/services/user/user.service';
import type { AuthCredentials } from '../../lib/models/auth';
import { UserRole } from '../../lib/models/user';

export class SigninForm {
  private authService: AuthService;
  private userService: UserService;
  private form: HTMLFormElement | null;
  private googleButton: HTMLButtonElement | null;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
    this.form = null;
    this.googleButton = null;
    this.attachListeners();
  }

  async handleSubmit(credentials: AuthCredentials & { nombre: string }): Promise<void> {
    try {
      // Registrar con Firebase
      await this.authService.register(credentials);
  
      // Redirigir a la página de inicio de sesión
      window.location.href = '/autenticacion/iniciarSesion';
    } catch (error: unknown) {
      console.error('Error en registro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  }

  private async handleGoogleSignin(e: Event): Promise<void> {
    e.preventDefault();
    try {
      await this.authService.registerWithGoogle();
      window.location.href = '/autenticacion/iniciarSesion';
    } catch (error) {
      console.error('Error en registro con Google:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(errorMessage);
    }
  }

  attachListeners(): void {
    this.form = document.getElementById('registerForm') as HTMLFormElement;
    this.googleButton = document.querySelector('.google-btn') as HTMLButtonElement;
    
    if (!this.form || !this.googleButton) {
      throw new Error('No se encontraron los elementos necesarios en el DOM');
    }
    
    this.form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nombre = (document.getElementById('name') as HTMLInputElement).value;
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;
      
      try {
        await this.handleSubmit({ nombre, email, password });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        alert(errorMessage);
      }
    });

    this.googleButton?.addEventListener('click', this.handleGoogleSignin.bind(this));
  }
}

// Inicializar el formulario
const registerForm = new SigninForm();