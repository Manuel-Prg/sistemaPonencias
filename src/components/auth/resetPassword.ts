import { AuthService } from '../../lib/services/auth/auth.service';

export class ResetPasswordForm {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    async handleSubmit(email: string): Promise<void> {
        try {
            await this.authService.sendPasswordResetEmail(email);
            alert('Se ha enviado un enlace de recuperación a tu correo electrónico');
            window.location.href = '/';
        } catch (error) {
            console.error('Error al enviar el correo de recuperación:', error);
            throw this.authService.handleAuthError(error);
        }
    }

    attachListeners(): void {
        const form = document.getElementById('resetPasswordForm') as HTMLFormElement;

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = (document.getElementById('email') as HTMLInputElement).value;

            try {
                await this.handleSubmit(email);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                alert(errorMessage);
            }
        });
    }
}

// Inicializar el formulario
const resetPasswordForm = new ResetPasswordForm();
resetPasswordForm.attachListeners();