import { AuthService } from "../../lib/services/auth/auth.service";
import { UserService } from "../../lib/services/user/user.service";
import type { UserData } from "../../lib/models/user";
import type { RevisorData } from "../../lib/models/revisor";
import type { User as FirebaseUser } from "firebase/auth";
import { revisorDataMapping } from "../../lib/models/revisor";

export class RevisorDataManager {
    private authService: AuthService;
    private userService: UserService;
    private form: HTMLFormElement;
  
    constructor() {
      this.authService = new AuthService();
      this.userService = new UserService();
      this.form = document.getElementById('constanciaForm') as HTMLFormElement;
    }
  
    public async initialize(): Promise<void> {
      try {
        await this.checkAuth();
        await this.loadUserData();
        this.setupEventListeners();
      } catch (error) {
        console.error('Error initializing revisor data:', error);
        window.location.href = '/autenticacion/iniciarSesion';
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
  
    private async loadUserData(): Promise<void> {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return;
  
      try {
        const userData = await this.userService.getUserData(currentUser.uid);
        if (userData.datos) {
          this.populateForm(userData.datos);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
  
    private populateForm(datos: UserData): void {
        Object.entries(revisorDataMapping).forEach(([revisorField, userField]) => {
          if (!userField) return;
          
          const input = document.getElementById(revisorField) as HTMLInputElement;
          if (input && datos[userField as keyof UserData]) {
            input.value = datos[userField as keyof UserData] as string;
          }
        });
      }
  
    private setupEventListeners(): void {
      // Form submission
      this.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleFormSubmit();
      });
  
      // Navigation handlers
      this.setupNavigationHandlers();
    }
  
    private async handleFormSubmit(): Promise<void> {
        try {
          const formData = this.getFormData();
          const currentUser = this.authService.getCurrentUser();
          
          if (!currentUser) {
            throw new Error('No authenticated user found');
          }
    
          const userData: Partial<UserData> = {
            nombre: formData.nombre,
            grado: formData.grado,
            institucion: formData.institucion,
            departamento: formData.departamento,
            email: formData.email,
            modalidad: formData.areaInteres // Aquí hacemos el mapeo inverso
          };
    
          await this.userService.updateUser(currentUser.uid, {
            datos: userData as UserData,
            actualizado: new Date().toISOString()
          });
    
          this.showSuccessMessage();
        } catch (error) {
          console.error('Error saving data:', error);
          this.showErrorMessage(error);
        }
      }
    private getFormData(): RevisorData {
      const formData = new FormData(this.form);
      return {
        nombre: formData.get('nombre') as string,
        grado: formData.get('grado') as string,
        institucion: formData.get('institucion') as string,
        areaInteres: formData.get('areaInteres') as string,
        departamento: formData.get('departamento') as string,
        email: formData.get('email') as string
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
        window.location.href = '/autenticacion/iniciarSesion';
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

  export async function initializeDatosRevisorPage(): Promise<void> {
    const dashboard = new RevisorDataManager();
    console.log('initializeDatosRevisorPage');
    await dashboard.initialize();
  }
  