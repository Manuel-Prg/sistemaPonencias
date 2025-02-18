import type { EstadoPonencia } from '../../lib/models/ponencia';
import { PonenciaService } from '../../lib/services/ponencias/ponencia.service';

interface DialogElements {
    overlay: HTMLElement | null;
    comments: HTMLTextAreaElement | null;
    title: HTMLElement | null;
    acceptButton: HTMLElement | null;
    cancelButton: HTMLElement | null;
}

interface ActionButtons {
    accept: HTMLElement | null;
    reject: HTMLElement | null;
    acceptWithObs: HTMLElement | null;
}

export class PonenciaHandlers {
    private dialogElements: DialogElements;
    private currentAction: EstadoPonencia | null = null;
    private ponenciaId: string;
    private ponenciaService: PonenciaService;
    private loadingState: boolean = false;

    constructor(ponenciaId: string) {
        this.ponenciaId = ponenciaId;
        this.ponenciaService = new PonenciaService();
        this.dialogElements = {
            overlay: document.getElementById('dialogOverlay'),
            comments: document.getElementById('dialogComments') as HTMLTextAreaElement,
            title: document.getElementById('dialogTitle'),
            acceptButton: document.getElementById('dialogAccept'),
            cancelButton: document.getElementById('dialogCancel')
        };
        console.log(this.ponenciaId);
        this.initializeEventListeners();
    }

    private showDialog(title: string, action: EstadoPonencia): void {
        if (this.loadingState) return;
        
        this.currentAction = action;
        if (this.dialogElements.title) {
            this.dialogElements.title.textContent = title;
        }
        if (this.dialogElements.overlay) {
            this.dialogElements.overlay.style.display = 'flex';
        }
        
        // Reset comments field
        if (this.dialogElements.comments) {
            this.dialogElements.comments.value = '';
        }
    }

    private hideDialog(): void {
        if (this.dialogElements.overlay) {
            this.dialogElements.overlay.style.display = 'none';
        }
        if (this.dialogElements.comments) {
            this.dialogElements.comments.value = '';
        }
        this.currentAction = null;
    }

    private setLoadingState(loading: boolean): void {
        this.loadingState = loading;
        
        // Disable all action buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            if (button instanceof HTMLButtonElement) {
                button.disabled = loading;
                if (loading) {
                    button.classList.add('opacity-50', 'cursor-not-allowed');
                } else {
                    button.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
        });

        // Disable dialog buttons
        if (this.dialogElements.acceptButton instanceof HTMLButtonElement) {
            this.dialogElements.acceptButton.disabled = loading;
        }
        if (this.dialogElements.cancelButton instanceof HTMLButtonElement) {
            this.dialogElements.cancelButton.disabled = loading;
        }

        // Optional: Show loading indicator
        if (this.dialogElements.acceptButton) {
            this.dialogElements.acceptButton.textContent = loading ? 'Guardando...' : 'Aceptar';
        }
    }

    private async handleDialogAccept(): Promise<void> {
        if (!this.currentAction || !this.dialogElements.comments) return;

        // Validate comments if required for certain states
        if (this.currentAction === 'rechazada' || this.currentAction === 'aceptada con correcciones') {
            if (!this.dialogElements.comments.value.trim()) {
                alert('Por favor, proporcione comentarios para explicar su decisión.');
                return;
            }
        }

        try {
            this.setLoadingState(true);
            const success = await this.ponenciaService.updatePonenciaStatus(
                this.ponenciaId,
                this.currentAction,
                this.dialogElements.comments.value.trim()
            );

            if (success) {
                alert('La ponencia ha sido actualizada exitosamente');
                // Redirect back to the list
                window.location.href = '/ponencias'; // Update this to match your route
            } else {
                throw new Error('Failed to update ponencia');
            }
        } catch (error) {
            console.error('Error in handleDialogAccept:', error);
            alert('Hubo un error al actualizar la ponencia. Por favor, intente nuevamente.');
        } finally {
            this.setLoadingState(false);
            this.hideDialog();
        }
    }

    private initializeActionButtons(): void {
        const buttons: ActionButtons = {
            accept: document.querySelector('.btn-accept'),
            reject: document.querySelector('.btn-reject'),
            acceptWithObs: document.querySelector('.btn-accept-with-obs')
        };

        buttons.accept?.addEventListener('click', () => 
            this.showDialog('Aceptar Ponencia', 'aceptada' as EstadoPonencia)
        );

        buttons.reject?.addEventListener('click', () => 
            this.showDialog('Rechazar Ponencia', 'rechazada' as EstadoPonencia)
        );

        buttons.acceptWithObs?.addEventListener('click', () => 
            this.showDialog('Aceptar con Observaciones', 'aceptada con correcciones' as EstadoPonencia)
        );
    }

    private initializeNavigationButtons(): void {
        const backButtons = [
            document.getElementById('logout-btn'),
            document.getElementById('regresar-btn-mobile')
        ];

        backButtons.forEach(button => {
            button?.addEventListener('click', () => {
                console.log('Regresando...');
                window.history.back();
            });
        });
    }

    private initializeDialogButtons(): void {
        this.dialogElements.acceptButton?.addEventListener('click', 
            () => this.handleDialogAccept()
        );

        this.dialogElements.cancelButton?.addEventListener('click', 
            () => this.hideDialog()
        );
    }

    private initializeEventListeners(): void {
        this.initializeActionButtons();
        this.initializeDialogButtons();
        this.initializeNavigationButtons();
    }
}