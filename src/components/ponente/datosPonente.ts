import { AuthService } from "../../lib/services/auth/auth.service";
import { PonenciaService } from "../../lib/services/ponencias/ponencia.service";
import type { User as FirebaseUser } from "firebase/auth";
import type { DataPonente } from "../../lib/models/ponente";
import { ponenteDataMapping } from "../../lib/models/ponente";

export class PonenteDataManager {
    private authService: AuthService;
    private ponenciaService: PonenciaService;
    private form: HTMLFormElement;
    private currentAuthorIndex: number = 0;
    private authors: DataPonente[] = [];
    private ponenciaId: string | null = null;

    constructor() {
        this.authService = new AuthService();
        this.ponenciaService = new PonenciaService();
        this.form = document.getElementById('constanciaForm') as HTMLFormElement;
    }

    public async initialize(): Promise<void> {
        try {
            await this.checkAuth();
            await this.loadPonenciaData();
            this.setupEventListeners();
            this.updateAuthorCounter();
            this.updateNavigationButtons();
        } catch (error) {
            console.error('Error initializing ponente data:', error);
        }
    }

    private async checkAuth(): Promise<void> {
        const user = await new Promise<FirebaseUser | null>((resolve) => {
            const unsubscribe = this.authService.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });

        if (!user) {
            await this.authService.signOut();
            throw new Error('No authenticated user');
        }
    }

    private async loadPonenciaData(): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) return;
        console.log(currentUser);
        try {
            // Get ponencia by user ID
            const ponencia = await this.ponenciaService.getPonenciaById(currentUser.uid);
            console.log(ponencia);
            if (!ponencia) {
                throw new Error('No se encontró ponencia asociada al usuario');
            }

            // Get the first ponencia (assuming one user can only have one ponencia)
            this.ponenciaId = ponencia.id;

            // Load authors from ponencia
            // Assuming ponencia.autores is structured as { autor1: {...}, autor2: {...} }  
            this.authors = Object.values(ponencia.autores) || [{
                nombre: '',
                institucion: '',
                departamento: '',
                email: '',
                modalidad: ''
            }];

            // Populate form with first author's data
            console.log(this.authors[0]);
            this.populateForm(this.authors[this.currentAuthorIndex]);
        } catch (error) {
            console.error('Error loading ponencia data:', error);
            this.showErrorMessage(error);
        }
    }

    private populateForm(authorData: DataPonente): void {
        console.log(authorData);
        if (!authorData) return;

        Object.entries(ponenteDataMapping).forEach(([field, key]) => {
            const input = document.getElementById(field) as HTMLInputElement;
            if (input && authorData[key as keyof DataPonente]) {
                input.value = authorData[key as keyof DataPonente] as string;
            }
        });
    }

    private updateAuthorCounter(): void {
        const counterElement = document.getElementById('authorCounter');
        if (counterElement) {
            counterElement.textContent = `Autor ${this.currentAuthorIndex + 1} de ${this.authors.length}`;
        }
    }

    private updateNavigationButtons(): void {
        const prevBtn = document.querySelector('.nav-btn:first-child') as HTMLButtonElement;
        const nextBtn = document.querySelector('.nav-btn:last-child') as HTMLButtonElement;

        if (prevBtn && nextBtn) {
            prevBtn.disabled = this.currentAuthorIndex === 0;
            nextBtn.disabled = this.currentAuthorIndex === this.authors.length - 1;
        }
    }

    private setupEventListeners(): void {
        // Form submission
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit();
        });

        // Author navigation
        const [prevBtn, nextBtn] = document.querySelectorAll('.nav-btn');
        prevBtn?.addEventListener('click', () => this.navigateAuthors('prev'));
        nextBtn?.addEventListener('click', () => this.navigateAuthors('next'));

        // Add author button
        document.getElementById('addAuthor')?.addEventListener('click', () => this.handleAddAuthor());
        document.getElementById('addAuthor-btn-mobile')?.addEventListener('click', () => this.handleAddAuthor());

        // Navigation handlers
        this.setupNavigationHandlers();
    }

    private navigateAuthors(direction: 'prev' | 'next'): void {
        if (direction === 'prev' && this.currentAuthorIndex > 0) {
            this.currentAuthorIndex--;
        } else if (direction === 'next' && this.currentAuthorIndex < this.authors.length - 1) {
            this.currentAuthorIndex++;
        }

        this.populateForm(this.authors[this.currentAuthorIndex]);
        this.updateAuthorCounter();
        this.updateNavigationButtons();
    }

    private async handleAddAuthor(): Promise<void> {
        if (this.authors.length >= 3) {
            this.showErrorMessage({ message: 'No se pueden agregar más de 3 autores' });
            return;
        }

        const newAuthor: DataPonente = {
            nombre: '',
            institucion: '',
            departamento: '',
            email: '',
            modalidad: ''
        };

        this.authors.push(newAuthor);
        this.currentAuthorIndex = this.authors.length - 1;
        this.populateForm(newAuthor);
        this.updateAuthorCounter();
        this.updateNavigationButtons();
    }

    private async handleFormSubmit(): Promise<void> {
        try {
            const formData = this.getFormData();
            this.authors[this.currentAuthorIndex] = formData;

            if (this.ponenciaId) {
                let ponencia = await this.ponenciaService.getPonenciaById(this.ponenciaId);
                ponencia = {
                    ...ponencia,
                    autores: this.authors
                };
                await this.ponenciaService.updatePonencia(this.ponenciaId, ponencia);
                this.showSuccessMessage();
            }
        } catch (error) {
            console.error('Error saving data:', error);
            this.showErrorMessage(error);
        }
    }

    private getFormData(): DataPonente {
        const formData = new FormData(this.form);
        return {
            nombre: formData.get('nombre') as string,
            institucion: formData.get('institucion') as string,
            departamento: formData.get('departamento') as string,
            email: formData.get('email') as string,
            modalidad: formData.get('modalidad') as string,
        };
    }

    private setupNavigationHandlers(): void {
        // Desktop logout
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        // Mobile logout
        document.getElementById('logout-btn-mobile')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });
    }

    private async handleLogout(): Promise<void> {
        try {
            await this.authService.signOut();
            console.log('Logged out');
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }

    private showSuccessMessage(): void {
        const container = document.querySelector('.form-container');
        const message = document.createElement('div');
        message.className = 'alert alert-success';
        message.textContent = 'Datos guardados exitosamente';
        message.style.cssText = `
            background-color: #d4edda;
            color: #155724;
            padding: 1rem;
            margin-top: 1rem;
            border-radius: 4px;
            text-align: center;
        `;
        container?.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    }

    private showErrorMessage(error: any): void {
        const container = document.querySelector('.form-container');
        const message = document.createElement('div');
        message.className = 'alert alert-danger';
        message.textContent = `Error: ${error.message || 'No se pudieron guardar los datos'}`;
        message.style.cssText = `
            background-color: #f8d7da;
            color: #721c24;
            padding: 1rem;
            margin-top: 1rem;
            border-radius: 4px;
            text-align: center;
        `;
        container?.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    }
}

export async function initializeDatosPonentePage(): Promise<void> {
    const dashboard = new PonenteDataManager();
    await dashboard.initialize();
}