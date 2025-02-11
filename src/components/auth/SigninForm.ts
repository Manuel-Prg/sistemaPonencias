import { AuthService } from '../../lib/services/auth/auth.service';
import { UserService } from '../../lib/services/user/user.service';
import type { AuthCredentials } from '../../lib/models/auth';
import { UserRole } from '../../lib/models/user';

export class SigninForm {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
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

  attachListeners(): void {
    const form = document.getElementById('registerForm') as HTMLFormElement;
    
    form?.addEventListener('submit', async (e) => {
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
  }
}

// Inicializar el formulario
const registerForm = new SigninForm();
registerForm.attachListeners();