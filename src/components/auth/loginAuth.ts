import { AuthService } from '../../lib/services/auth/auth.service';

export class FormularioLogin {
  private servicioAuth: AuthService;
  private formulario!: HTMLFormElement;
  private botonGoogle!: HTMLButtonElement; 

  constructor() {
    this.servicioAuth = new AuthService();
    this.inicializarElementos();
    this.configurarEventos();
  }

  private inicializarElementos(): void {
    this.formulario = document.getElementById('loginForm') as HTMLFormElement;
    this.botonGoogle = document.querySelector('.google-btn') as HTMLButtonElement;

    if (!this.formulario || !this.botonGoogle) {
      throw new Error('No se encontraron los elementos necesarios en el DOM');
    }
  }

  private configurarEventos(): void {
    this.botonGoogle.addEventListener('click', this.manejarLoginGoogle.bind(this));
  }

  private async manejarLoginGoogle(evento: Event): Promise<void> {
    evento.preventDefault();
    
    try {
      this.botonGoogle.disabled = true;
      const respuesta = await this.servicioAuth.loginWithGoogle();
      
      if (respuesta.token && respuesta.user) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Error inesperado durante el inicio de sesión');
      }
    } finally {
      this.botonGoogle.disabled = false;
    }
  }
}

// Inicializar el formulario cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new FormularioLogin();
});