import { AuthService } from "../../lib/services/auth/auth.service";
import { PonenciaService } from "../../lib/services/ponencias/ponencia.service";
import { UserService } from "../../lib/services/user/user.service";
import type { Ponencia } from "../../lib/models/ponencia";
import type { DataPonente } from "../../lib/models/ponente";
import { EstadoPonencia } from "../../lib/models/ponencia";

const ROUTES = {
    LOGIN: "../autenticacion/iniciarSesion",
    DATOS: "/ponente/datosPonente",
    REGISTRO_VALIDO: "/ponente/registroValido",
    HERE: "/ponente/datosPonencia"
} as const;

type FormElements = {
    form: HTMLFormElement | null;
    nextBtn: HTMLButtonElement | null;
    backBtn: HTMLButtonElement | null;
    cancelBtn: HTMLButtonElement | null;
    progressSteps: NodeListOf<Element>;
    addAuthorBtn: HTMLButtonElement | null;
    topicButtons: NodeListOf<Element>;
    newTopicInput: HTMLInputElement | null;
    wordCount: HTMLElement | null;
    summaryTextarea: HTMLTextAreaElement | null;
    logoutButtons: NodeListOf<Element>;
    datosButtons: NodeListOf<Element>;
}

interface PonenciaFormData {
    autores: Record<string, DataPonente>;
    tema: string;
    titulo: string;
    resumen: string;
    fuente: string;
    userId: string | null;
}

class PonenciaFormHandler {
    private currentStep: number = 1;
    private totalSteps: number = 4;
    private formData: PonenciaFormData = {
        autores: {},
        tema: '',
        titulo: '',
        resumen: '',
        fuente: '',
        userId: null
    };
    private elements: FormElements = {
        form: null,
        nextBtn: null,
        backBtn: null,
        cancelBtn: null,
        progressSteps: document.querySelectorAll('.step'),
        addAuthorBtn: null,
        topicButtons: document.querySelectorAll('.topic-btn'),
        newTopicInput: null,
        wordCount: null,
        summaryTextarea: null,
        logoutButtons: document.querySelectorAll('#logout-btn, #logout-btn-mobile'),
        datosButtons: document.querySelectorAll('#datos-btn, #datos-btn-mobile')
    };
    private ponenciaService: PonenciaService;
    private userService: UserService;
    private authService: AuthService;

    constructor() {
        this.ponenciaService = new PonenciaService();
        this.userService = new UserService();
        this.authService = new AuthService();
        this.initializeElements();
        this.attachEventListeners();
        this.checkAuth();
    }

    private initializeElements(): void {
        this.elements = {
            form: document.getElementById('multiStepForm') as HTMLFormElement,
            nextBtn: document.querySelector('.btn-next'),
            backBtn: document.querySelector('.btn-back'),
            cancelBtn: document.querySelector('.btn-cancel'),
            progressSteps: document.querySelectorAll('.step'),
            addAuthorBtn: document.querySelector('.add-author'),
            topicButtons: document.querySelectorAll('.topic-btn'),
            newTopicInput: document.querySelector('input[name="newTopic"]'),
            wordCount: document.querySelector('.word-count'),
            summaryTextarea: document.querySelector('textarea[name="summary"]'),
            logoutButtons: document.querySelectorAll('#logout-btn, #logout-btn-mobile'),
            datosButtons: document.querySelectorAll('#datos-btn, #datos-btn-mobile')
        };

        if (this.elements.newTopicInput) {
            this.elements.newTopicInput.disabled = true;
        }
    }

    private attachEventListeners(): void {
        this.elements.nextBtn?.addEventListener('click', () => this.handleNext());
        this.elements.backBtn?.addEventListener('click', () => this.handleBack());
        this.elements.cancelBtn?.addEventListener('click', () => this.handleCancel());
        this.elements.addAuthorBtn?.addEventListener('click', () => this.addAuthorField());

        this.setupTopicListeners();

        if (this.elements.summaryTextarea) {
            this.elements.summaryTextarea.addEventListener('input', (e) => this.handleWordCount(e));
        }

        this.elements.logoutButtons.forEach(button => {
            button.addEventListener('click', () => this.handleLogout());
        });

        this.elements.datosButtons.forEach(button => {
            button.addEventListener('click', () => this.navigateToDatos());
        });
    }

    private checkAuth(): void {
        this.authService.onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = ROUTES.LOGIN;
                return;
            }
            this.formData.userId = user.uid;
        });
    }

    private setupTopicListeners(): void {
        const lastTopicButton = this.elements.topicButtons[this.elements.topicButtons.length - 1];

        this.elements.topicButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.elements.topicButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');

                if (button === lastTopicButton && this.elements.newTopicInput) {
                    this.elements.newTopicInput.disabled = false;
                    this.elements.newTopicInput.focus();
                    this.formData.tema = '';
                } else if (this.elements.newTopicInput) {
                    this.elements.newTopicInput.disabled = true;
                    this.elements.newTopicInput.value = '';
                    this.formData.tema = (button as HTMLElement).textContent || '';
                }
            });
        });

        this.elements.newTopicInput?.addEventListener('input', (e) => {
            if (lastTopicButton.classList.contains('selected')) {
                this.formData.tema = (e.target as HTMLInputElement).value.trim();
            }
        });
    }

    private validateStep(step: number): boolean {
        const validators: Record<number, () => string | null> = {
            1: () => {
                const titulo = (this.elements.form?.querySelector('input[name="title"]') as HTMLInputElement)?.value;
                const primerAutor = (this.elements.form?.querySelector('input[name="author"]') as HTMLInputElement)?.value;
                
                if (!titulo?.trim()) return 'Por favor ingrese el título de la ponencia';
                if (!primerAutor?.trim()) return 'Por favor ingrese al menos el autor principal';
                return null;
            },
            2: () => {
                const selectedButton = document.querySelector('.topic-btn.selected');
                
                if (!selectedButton) return 'Por favor seleccione un tema';
                if (selectedButton === this.elements.topicButtons[this.elements.topicButtons.length - 1] && !this.formData.tema) {
                    return 'Por favor ingrese el nuevo tema';
                }
                return null;
            },
            3: () => {
                const resumen = (this.elements.form?.querySelector('textarea[name="summary"]') as HTMLTextAreaElement)?.value;
                const wordCount = resumen.trim().split(/\s+/).length;
                
                if (wordCount < 300) return 'El resumen debe contener al menos 300 palabras';
                if (wordCount > 500) return 'El resumen debe contener máximo 500 palabras';
                return null;
            },
            4: () => {
                const fuente = (this.elements.form?.querySelector('select[name="source"]') as HTMLSelectElement)?.value;
                if (!fuente) return 'Por favor seleccione cómo se enteró del evento';
                return null;
            }
        };

        const error = validators[step]?.();
        if (error) {
            this.showError(error);
            return false;
        }
        return true;
    }

    private updateFormData(): void {
        const stepData = document.querySelector(`[data-step="${this.currentStep}"]`);
        
        switch(this.currentStep) {
            case 1:
                this.formData.titulo = (stepData?.querySelector('input[name="title"]') as HTMLInputElement)?.value;
                this.formData.autores = {};
                const authorInputs = stepData?.querySelectorAll('input[name="author"]');
                authorInputs?.forEach((input, index) => {
                    const value = (input as HTMLInputElement).value.trim();
                    if (value) {
                        this.formData.autores[`autor${index + 1}`] = {
                            nombre: value,
                            email: '',
                            departamento: '',
                            institucion: '',
                            modalidad: ''
                        };
                    }
                });
                break;
            case 3:
                this.formData.resumen = (stepData?.querySelector('textarea[name="summary"]') as HTMLTextAreaElement)?.value;
                break;
            case 4:
                this.formData.fuente = (stepData?.querySelector('select[name="source"]') as HTMLSelectElement)?.value;
                break;
        }
    }

    private async handleNext(): Promise<void> {
        if (!this.validateStep(this.currentStep)) return;

        if (this.currentStep === this.totalSteps) {
            await this.submitForm();
            return;
        }

        this.updateFormData();
        this.showStep(this.currentStep + 1);
    }

    private handleBack(): void {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    }

    private handleCancel(): void {
        if (confirm('¿Está seguro que desea cancelar? Se perderán todos los datos ingresados.')) {
            window.location.href = ROUTES.HERE;
        }
    }

    private handleWordCount(event: Event): void {
        const target = event.target as HTMLTextAreaElement;
        const words = target.value.trim().split(/\s+/).length;
        if (this.elements.wordCount) {
            this.elements.wordCount.textContent = `${words}/300 palabras`;
        }
    }

    private async handleLogout(): Promise<void> {
        try {
            await this.authService.signOut();
            window.location.href = ROUTES.LOGIN;
        } catch (error) {
            this.showError('Error al cerrar sesión');
        }
    }

    private navigateToDatos(): void {
        window.location.href = ROUTES.DATOS;
    }

    public showStep(step: number): void {
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.querySelector(`[data-step="${step}"]`)?.classList.remove('hidden');
        
        this.elements.progressSteps.forEach((stepEl, index) => {
            if (index < step) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('active');
            }
        });

        if (this.elements.backBtn) {
            this.elements.backBtn.classList.toggle('hidden', step === 1);
        }
        if (this.elements.nextBtn) {
            this.elements.nextBtn.textContent = step === this.totalSteps ? 'Enviar' : 'Siguiente';
        }
        
        this.currentStep = step;
    }

    private addAuthorField(): void {
        const authorInputs = document.querySelectorAll('input[name="author"]');
        if (authorInputs.length >= 3) {
            this.showError('No se pueden agregar más de 3 autores');
            return;
        }

        const newAuthorGroup = document.createElement('div');
        newAuthorGroup.className = 'form-group';
        newAuthorGroup.innerHTML = `
            <label>Autor ${authorInputs.length + 1}</label>
            <div class="input-icon">
                <input type="text" name="author" required placeholder="">
                <i class="icon-user"></i>
                <button type="button" class="remove-author">×</button>
            </div>
        `;

        const lastAuthorGroup = authorInputs[authorInputs.length - 1].closest('.form-group');
        lastAuthorGroup?.after(newAuthorGroup);

        newAuthorGroup.querySelector('.remove-author')?.addEventListener('click', () => {
            newAuthorGroup.remove();
            this.updateAuthorsOrder();
        });
    }

    private updateAuthorsOrder(): void {
        const authorLabels = document.querySelectorAll('.form-group label');
        authorLabels.forEach((label, index) => {
            if (label.textContent?.includes('Autor')) {
                label.textContent = `Autor ${index + 1}`;
            }
        });
    }

    private async submitForm(): Promise<void> {
        try {
            this.updateFormData();
            
            if (!this.formData.autores.autor1) {
                this.showError('Se requiere al menos un autor principal');
                this.showStep(1);
                return;
            }
            const user = await this.authService.getUserId();
           
            const ponencia: Ponencia = {
                id: user, // Será generado por Firestore
                titulo: this.formData.titulo,
                resumen: this.formData.resumen,
                autores: Object.values(this.formData.autores),
                creado: new Date(),
                estado: EstadoPonencia.PENDIENTE,
                evaluaciones: [],
                userId: this.formData.userId || ''
            };

            await this.ponenciaService.createPonencia(ponencia);
            alert('¡Ponencia registrada exitosamente!');
            window.location.href = ROUTES.REGISTRO_VALIDO;
        
        } catch (error) {
            console.error('Error al guardar la ponencia:', error);
            this.showError('Error al guardar la ponencia. Por favor intente nuevamente.');
        }
    }

    private showError(message: string): void {
        alert(message);
    }
}

// Initialize form handler
document.addEventListener('DOMContentLoaded', () => {
    const formHandler = new PonenciaFormHandler();
    formHandler.showStep(1);
});