import { AuthService } from "../../lib/services/auth/auth.service";
import { showError, showSuccess } from "../../utils/notifications";

class ResetPasswordAction {
    private authService: AuthService;
    private mode: string | null;
    private oobCode: string | null;
    private apiKey: string | null;

    private resetCard: HTMLElement | null;
    private messageCard: HTMLElement | null;
    private messageTitle: HTMLElement | null;
    private messageText: HTMLElement | null;
    private form: HTMLFormElement | null;

    constructor() {
        this.authService = new AuthService();
        const urlParams = new URLSearchParams(window.location.search);
        this.mode = urlParams.get('mode');
        this.oobCode = urlParams.get('oobCode');
        this.apiKey = urlParams.get('apiKey');

        this.resetCard = document.getElementById('resetPasswordCard');
        this.messageCard = document.getElementById('messageCard');
        this.messageTitle = document.getElementById('messageTitle');
        this.messageText = document.getElementById('messageText');
        this.form = document.getElementById('newPasswordForm') as HTMLFormElement;

        this.init();
    }

    private init(): void {
        if (!this.mode || !this.oobCode) {
            this.showMessage('Error', 'Enlace inválido o expirado.');
            return;
        }

        switch (this.mode) {
            case 'resetPassword':
                this.handleResetPasswordMode();
                break;
            // Can add handlers for 'recoverEmail' or 'verifyEmail' here if needed
            default:
                this.showMessage('Error', 'Operación no soportada.');
        }
    }

    private handleResetPasswordMode(): void {
        // Show the reset password form
        if (this.resetCard && this.messageCard) {
            this.resetCard.style.display = 'block';
            this.messageCard.style.display = 'none';
        }

        this.form?.addEventListener('submit', this.handleFormSubmit.bind(this));
    }

    private async handleFormSubmit(e: Event): Promise<void> {
        e.preventDefault();

        const passwordInput = document.getElementById('newPassword') as HTMLInputElement;
        const confirmInput = document.getElementById('confirmPassword') as HTMLInputElement;

        const newPassword = passwordInput.value;
        const confirmPassword = confirmInput.value;

        if (newPassword !== confirmPassword) {
            showError('Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            await this.authService.confirmPasswordReset(this.oobCode!, newPassword);
            showSuccess('Contraseña restablecida correctamente');

            // Show success message and redirect
            this.showMessage('¡Éxito!', 'Tu contraseña ha sido actualizada. Redirigiendo al inicio de sesión...');
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);

        } catch (error: any) {
            console.error(error);
            showError(error.message || 'Error al restablecer la contraseña');
        }
    }

    private showMessage(title: string, text: string): void {
        if (this.resetCard && this.messageCard && this.messageTitle && this.messageText) {
            this.resetCard.style.display = 'none';
            this.messageCard.style.display = 'block';
            this.messageTitle.textContent = title;
            this.messageText.textContent = text;
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ResetPasswordAction();
});
