import { AuthService } from "../../lib/services/auth/auth.service";
import { UserService } from "../../lib/services/user/user.service";
import { RevisorService } from "../../lib/services/revisor/revisor.services";
import type { Ponencia, EstadoPonencia, PonenciaAsignada } from "../../lib/models/ponencia";
import type { User as FirebaseUser } from 'firebase/auth';

interface GroupedPonencias {
  pendientes: Ponencia[];
  evaluadas: Ponencia[];
}

export class DashboardManager {
  private authService: AuthService;
  private userService: UserService;
  private revisorService: RevisorService;
  private ponenciasData: Ponencia[] = [];
  private currentActiveStatus: 'pendientes' | 'evaluadas' = 'pendientes';

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
    this.revisorService = new RevisorService();
  }

  private groupPonencias(ponencias: Ponencia[]): GroupedPonencias {
    return {
      pendientes: ponencias.filter(p => p.estado === 'pendiente'),
      evaluadas: ponencias.filter(p => 
        p.estado === 'aceptada' || 
        p.estado === 'aceptada con correcciones' ||
        p.estado === 'rechazada'
      )
    };
  }


  private updateUI(groupedPonencias: GroupedPonencias) {
    // Mostrar solo la columna activa
    const board = document.querySelector('.board');
    if (board) {
      board.innerHTML = `
        <div class="board-column">
          <div class="column-header">
            <h3>${this.capitalizeFirst(this.currentActiveStatus)}</h3>
            <span class="counter" id="${this.currentActiveStatus}-counter">
              ${groupedPonencias[this.currentActiveStatus].length}
            </span>
          </div>
          <div class="column-content" id="${this.currentActiveStatus}-column">
            ${this.renderPonencias(groupedPonencias[this.currentActiveStatus])}
          </div>
        </div>
      `;
    }

    // Update stats cards counters
    const pendienteCount = document.getElementById('pendiente-count');
    const evaluadaCount = document.getElementById('evaluada-count');

    if (pendienteCount) {
      pendienteCount.textContent = groupedPonencias.pendientes.length.toString();
    }
    if (evaluadaCount) {
      evaluadaCount.textContent = groupedPonencias.evaluadas.length.toString();
    }

    // Actualizar estado activo de las stat-cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
      const status = card.getAttribute('data-status');
      if (status === 'pendiente' && this.currentActiveStatus === 'pendientes') {
        card.classList.add('active');
      } else if (status === 'aprobada' && this.currentActiveStatus === 'evaluadas') {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }


  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private renderPonencias(ponencias: Ponencia[]): string {
    if (ponencias.length === 0) {
      return '<p class="empty-message">No hay ponencias en esta categoría</p>';
    }
    
    return ponencias.map(ponencia => this.createPonenciaCard(ponencia)).join('');
  }

  private createPonenciaCard(ponencia: Ponencia): string {
    const date = new Date(ponencia.creado).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let statusBadge = '';
    if (ponencia.estado === 'aceptada con correcciones') {
      statusBadge = '<div class="status-badge">Con correcciones</div>';
    } else if (ponencia.estado !== 'pendiente') {
      statusBadge = `<div class="status-badge">${this.capitalizeFirst(ponencia.estado)}</div>`;
    }

    return `
      <div class="ponencia-card" data-id="${ponencia.id}">
        <div class="ponencia-info">
          <h3>${ponencia.titulo}</h3>
          <p>${date}</p>
        </div>
        <span class="ponencia-status status-${ponencia.estado}">
          ${statusBadge}
        </span>
        <div class="ponencia-arrow">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>
    `;
  }

  private setupNavigationHandlers() {
    // Manejador para el botón "Mis Datos" en el header
    const misDatosBtn = document.querySelector('datos-btn');
    misDatosBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '../revisor/datosRevisor';
    });

    // Manejador para el botón "Cerrar Sesión" en el header
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', async () => {
      try {
        await this.authService.signOut();
        window.location.href = '/autenticacion/iniciarSesion';
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    });

    // Manejadores para los botones de navegación móvil
    const misDatosBtnMobile = document.getElementById('datos-btn-mobile');
    misDatosBtnMobile?.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '../revisor/datosRevisor';
    });

    const logoutBtnMobile = document.getElementById('logout-btn-mobile');
    logoutBtnMobile?.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await this.authService.signOut();
        window.location.href = '/autenticacion/iniciarSesion';
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    });
  }

  private setupEventListeners() {
    this.setupNavigationHandlers();
    this.setupStatCardHandlers();

    // Ponencia card click handler
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const ponenciaCard = target.closest('.ponencia-card') as HTMLElement;
      
      if (ponenciaCard) {
        const ponenciaId = ponenciaCard.getAttribute('data-id');
        if (ponenciaId) {
          window.location.href = `/revisor/${ponenciaId}`;
        }
      }
    });
  }

  private setupStatCardHandlers() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
      card.addEventListener('click', () => {
        const status = card.getAttribute('data-status');
        if (status === 'pendiente') {
          this.currentActiveStatus = 'pendientes';
        } else if (status === 'evaluada') {
          this.currentActiveStatus = 'evaluadas';
        }
        
        const groupedPonencias = this.groupPonencias(this.ponenciasData);
        this.updateUI(groupedPonencias);
      });
    });
  }
  private async updateWelcomeMessage(userData: any) {
    const welcomeElement = document.querySelector('.welcome');
    if (welcomeElement) {
      welcomeElement.textContent = `¡Bienvenido ${userData.nombre}!`;
    }
  }


  public async initialize(): Promise<void> {
    console.log('initialize');
    
    const user = await new Promise<FirebaseUser | null>((resolve) => {
      const unsubscribe = this.authService.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      });
    });

    if (!user) {
      console.log('No user found, redirecting to login');
      await this.authService.signOut();
      window.location.href = '/autenticacion/iniciarSesion';
      return;
    }

    try {
      const userData = await this.userService.getUserData(user.uid);
      if (userData.rol !== 'revisor') {
        throw new Error('Usuario no tiene permisos de revisor');
      }

      await this.updateWelcomeMessage(userData);

      // Activar por defecto la tarjeta de pendientes
      const pendingCard = document.querySelector('.stat-card[data-status="pendiente"]');
      pendingCard?.classList.add('active');
      // Setup initial event listeners
      this.setupEventListeners();

      // Setup realtime updates
      this.userService.setupRealtimeUpdates(user.uid, async (updatedUserData) => {
        if (updatedUserData.ponenciasAsignadas?.length) {
          this.ponenciasData = await this.revisorService.getPresentations(
            updatedUserData.ponenciasAsignadas.map(a => a.ponencia)
          );
          const groupedPonencias = this.groupPonencias(this.ponenciasData);
          this.updateUI(groupedPonencias);
        } else {
          this.ponenciasData = [];
          this.updateUI({
            pendientes: [],
            evaluadas: []
          });
        }
      });
    } catch (error) {
      console.error('Error initializing revisor page:', error);
      await this.authService.signOut();
      window.location.href = '/autenticacion/iniciarSesion';
    }
  }
}

export async function initializeRevisorPage(): Promise<void> {
  const dashboard = new DashboardManager();
  console.log('initializeRevisorPage');
  await dashboard.initialize();
}