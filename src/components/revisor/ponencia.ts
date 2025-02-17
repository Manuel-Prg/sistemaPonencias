import type { EstadoPonencia } from '../../lib/models/ponencia';

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

    constructor(ponenciaId: string) {
        this.ponenciaId = ponenciaId;
        this.dialogElements = {
            overlay: document.getElementById('dialogOverlay'),
            comments: document.getElementById('dialogComments') as HTMLTextAreaElement,
            title: document.getElementById('dialogTitle'),
            acceptButton: document.getElementById('dialogAccept'),
            cancelButton: document.getElementById('dialogCancel')
        };

        this.initializeEventListeners();
    }

    private showDialog(title: string, action: EstadoPonencia): void {
        this.currentAction = action;
        if (this.dialogElements.title) {
            this.dialogElements.title.textContent = title;
        }
        if (this.dialogElements.overlay) {
            this.dialogElements.overlay.style.display = 'flex';
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

    private handleDialogAccept(): void {
        if (this.currentAction && this.dialogElements.comments) {
            // Aquí irían las llamadas a tu API para actualizar la ponencia
            console.log('Actualizando ponencia:', {
                id: this.ponenciaId,
                action: this.currentAction,
                comments: this.dialogElements.comments.value
            });
        }
        this.hideDialog();
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