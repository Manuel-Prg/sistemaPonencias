import { AuthService } from '../../lib/services/auth/auth.service';

export class FormularioRegistro {
  private servicioAuth: AuthService;
  private formulario!: HTMLFormElement;
  private botonRegistrar!: HTMLButtonElement;
  private botonGoogle!: HTMLButtonElement; // Añadimos la referencia al botón de Google

  constructor() {
    this.servicioAuth = new AuthService();
    this.inicializarElementos();
    this.configurarEventos();
  }

  private inicializarElementos(): void {
    this.formulario = document.getElementById('registerForm') as HTMLFormElement;
    this.botonRegistrar = document.querySelector('.register-btn') as HTMLButtonElement;
    this.botonGoogle = document.querySelector('.google-btn') as HTMLButtonElement; // Referencia al botón de Google

    if (!this.formulario || !this.botonRegistrar || !this.botonGoogle) {
      throw new Error('No se encontraron los elementos necesarios en el DOM');
    }
  }

  private configurarEventos(): void {
    this.formulario.addEventListener('submit', this.manejarRegistro.bind(this));
    this.botonGoogle.addEventListener('click', this.manejarRegistroGoogle.bind(this)); // Evento para Google
  }

  private async manejarRegistro(evento: Event): Promise<void> {
    evento.preventDefault();
    
    const formData = new FormData(this.formulario);
    const nombre = formData.get('name')?.toString() ?? '';
    const email = formData.get('email')?.toString() ?? '';
    const password = formData.get('password')?.toString() ?? '';

    try {
      this.botonRegistrar.disabled = true;
      await this.servicioAuth.register({ nombre, email, password });
      window.location.href = '/dashboard';
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Error inesperado durante el registro');
      }
    } finally {
      this.botonRegistrar.disabled = false;
    }
  }

  private async manejarRegistroGoogle(evento: Event): Promise<void> {
    evento.preventDefault();

    try {
      await this.servicioAuth.registerWithGoogle();
      window.location.href = '/dashboard'; // Redirigir al dashboard después de un inicio de sesión exitoso
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Error inesperado durante el registro con Google');
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new FormularioRegistro();
});