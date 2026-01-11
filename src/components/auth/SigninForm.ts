// SigninForm.ts
import { AuthService } from '../../lib/services/auth/auth.service';
import { UserService } from '../../lib/services/user/user.service';
import type { AuthCredentials } from '../../lib/models/auth';
import { UserRole } from '../../lib/models/user';
import {
  validatePassword,
  getStrengthLabel,
  checkPasswordPwned,
  type PasswordValidationResult
} from '../../utils/passwordValidator';
import {
  showToast,
  showConfirm,
  showSuccess,
  showError,
  showWarning
} from '../../utils/notifications';

export class SigninForm {
  private authService: AuthService;
  private userService: UserService;
  private form: HTMLFormElement | null;
  private googleButton: HTMLButtonElement | null;
  private passwordInput: HTMLInputElement | null;
  private strengthFill: HTMLElement | null;
  private strengthText: HTMLElement | null;
  private passwordHelp: HTMLElement | null;
  private currentValidation: PasswordValidationResult | null = null;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
    this.form = null;
    this.googleButton = null;
    this.passwordInput = null;
    this.strengthFill = null;
    this.strengthText = null;
    this.passwordHelp = null;
    this.attachListeners();
  }

  async handleSubmit(credentials: AuthCredentials & { nombre: string }): Promise<void> {
    try {
      // Validate password strength before submitting
      if (!this.currentValidation || !this.currentValidation.isValid) {
        showError('Por favor, usa una contraseña más segura');
        return;
      }

      // Check if password has been pwned
      const pwnedResult = await checkPasswordPwned(credentials.password);
      if (pwnedResult.isPwned) {
        const confirmSubmit = await showConfirm({
          title: '⚠️ Contraseña Comprometida',
          message: `Esta contraseña ha sido encontrada en ${pwnedResult.count.toLocaleString()} filtraciones de datos.\n\nSe recomienda usar una contraseña diferente. ¿Deseas continuar de todos modos?`,
          confirmText: 'Continuar',
          cancelText: 'Cambiar contraseña',
          type: 'warning'
        });

        if (!confirmSubmit) {
          return;
        }
      }

      await this.authService.register(credentials);

      // Get user and set cookie
      const user = this.authService.getCurrentUser();
      if (user) {
        const token = await user.getIdToken();
        document.cookie = `session=${token}; path=/; max-age=2592000; samesite=strict`;
        document.cookie = `role=${UserRole.PONENTE}; path=/; max-age=2592000; samesite=strict`;
      }

      // Show success notification
      showSuccess('¡Registro exitoso! Redirigiendo...');

      // Redirect after a short delay to show the notification
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (error: unknown) {
      console.error('Error en registro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError(errorMessage);
    }
  }

  private async handleGoogleSignin(e: Event): Promise<void> {
    e.preventDefault();
    try {
      await this.authService.registerWithGoogle();

      // Get user and set cookie
      const user = this.authService.getCurrentUser();
      if (user) {
        const token = await user.getIdToken();
        document.cookie = `session=${token}; path=/; max-age=2592000; samesite=strict`;
        document.cookie = `role=${UserRole.PONENTE}; path=/; max-age=2592000; samesite=strict`;
      }

      showSuccess('¡Registro con Google exitoso!');
      setTimeout(() => {
        window.location.href = '/ponente/datosPonencia';
      }, 1500);
    } catch (error) {
      console.error('Error en registro con Google:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError(errorMessage);
    }
  }

  private handlePasswordInput(e: Event): void {
    const password = (e.target as HTMLInputElement).value;

    if (!password) {
      this.resetPasswordUI();
      return;
    }

    // Validate password
    this.currentValidation = validatePassword(password);

    // Update strength indicator
    this.updateStrengthIndicator(this.currentValidation);

    // Update requirements checklist
    this.updateRequirements(this.currentValidation);

    // Update help text
    this.updateHelpText(this.currentValidation);
  }

  private updateStrengthIndicator(validation: PasswordValidationResult): void {
    if (!this.strengthFill || !this.strengthText) return;

    // Remove all strength classes
    this.strengthFill.classList.remove('weak', 'medium', 'strong', 'very-strong');
    this.strengthText.classList.remove('weak', 'medium', 'strong', 'very-strong');

    // Add current strength class
    this.strengthFill.classList.add(validation.strength);
    this.strengthText.classList.add(validation.strength);

    // Update text
    this.strengthText.textContent = getStrengthLabel(validation.strength);
  }

  private updateRequirements(validation: PasswordValidationResult): void {
    const requirements = validation.requirements;

    Object.keys(requirements).forEach((key) => {
      const li = document.querySelector(`[data-requirement="${key}"]`);
      if (li) {
        const isMet = requirements[key as keyof typeof requirements];
        li.classList.toggle('met', isMet);
        li.classList.toggle('unmet', !isMet);
      }
    });
  }

  private updateHelpText(validation: PasswordValidationResult): void {
    if (!this.passwordHelp) return;

    // Clear previous classes
    this.passwordHelp.classList.remove('show', 'error', 'warning', 'success', 'info');

    if (validation.errors.length > 0) {
      this.passwordHelp.textContent = validation.errors[0];
      this.passwordHelp.classList.add('show', 'error');
    } else if (validation.suggestions.length > 0) {
      this.passwordHelp.textContent = validation.suggestions[0];
      this.passwordHelp.classList.add('show', 'warning');
    } else if (validation.strength === 'very-strong') {
      this.passwordHelp.textContent = '¡Excelente! Esta es una contraseña muy segura.';
      this.passwordHelp.classList.add('show', 'success');
    } else if (validation.strength === 'strong') {
      this.passwordHelp.textContent = 'Buena contraseña. Considera hacerla más larga para mayor seguridad.';
      this.passwordHelp.classList.add('show', 'info');
    }
  }

  private resetPasswordUI(): void {
    if (this.strengthFill) {
      this.strengthFill.classList.remove('weak', 'medium', 'strong', 'very-strong');
    }
    if (this.strengthText) {
      this.strengthText.classList.remove('weak', 'medium', 'strong', 'very-strong');
      this.strengthText.textContent = '';
    }
    if (this.passwordHelp) {
      this.passwordHelp.classList.remove('show', 'error', 'warning', 'success', 'info');
      this.passwordHelp.textContent = '';
    }

    // Reset all requirements
    document.querySelectorAll('.password-requirements li').forEach((li) => {
      li.classList.remove('met', 'unmet');
    });

    this.currentValidation = null;
  }

  attachListeners(): void {
    this.form = document.getElementById('registerForm') as HTMLFormElement;
    this.googleButton = document.querySelector('.google-btn') as HTMLButtonElement;
    this.passwordInput = document.getElementById('password') as HTMLInputElement;
    this.strengthFill = document.querySelector('.strength-fill') as HTMLElement;
    this.strengthText = document.querySelector('.strength-text') as HTMLElement;
    this.passwordHelp = document.getElementById('passwordHelp') as HTMLElement;

    if (!this.form || !this.googleButton) {
      throw new Error('No se encontraron los elementos necesarios en el DOM');
    }

    // Password input listener for real-time validation
    this.passwordInput?.addEventListener('input', this.handlePasswordInput.bind(this));

    // Form submit listener
    this.form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nombre = (document.getElementById('name') as HTMLInputElement).value;
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;

      await this.handleSubmit({ nombre, email, password });
    });

    this.googleButton?.addEventListener('click', this.handleGoogleSignin.bind(this));
  }
}

// Inicializar el formulario
const registerForm = new SigninForm();