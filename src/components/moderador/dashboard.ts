import { SalaService } from '../../lib/services/salas/sala.service';
import { AuthService } from '../../lib/services/auth/auth.service';
import { UserService } from '../../lib/services/user/user.service';
import type { Ponencia } from '../../lib/models/ponencia';
import { EstadoPonencia } from '../../lib/models/ponencia';
import type { User as FirebaseUser } from 'firebase/auth';

interface GroupedPonencias {
  pendientes: Ponencia[];
  aceptadas: Ponencia[];
}

export class SalaManager {
  private salaService: SalaService;
  private authService: AuthService;
  private userService: UserService;
  private ponenciasData: Ponencia[] = [];
  private currentActiveStatus: 'pendientes' | 'aceptadas' = 'pendientes';

  constructor() {
    this.salaService = new SalaService();
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  private groupPonencias(ponencias: Ponencia[]): GroupedPonencias {
    return {
      pendientes: ponencias.filter(p => p.estado === EstadoPonencia.PENDIENTE),
      aceptadas: ponencias.filter(p => p.estado === EstadoPonencia.ACEPTADA)
    };
  }

  private updateUI(groupedPonencias: GroupedPonencias) {
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
    const aceptadaCount = document.getElementById('aceptada-count');

    if (pendienteCount) {
      pendienteCount.textContent = groupedPonencias.pendientes.length.toString();
    }
    if (aceptadaCount) {
      aceptadaCount.textContent = groupedPonencias.aceptadas.length.toString();
    }

    // Update active state of stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
      const status = card.getAttribute('data-status');
      if (status === 'pendiente' && this.currentActiveStatus === 'pendientes') {
        card.classList.add('active');
      } else if (status === 'aceptada' && this.currentActiveStatus === 'aceptadas') {
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

    const statusBadge = ponencia.estado === EstadoPonencia.ACEPTADA ? 
      '<div class="status-badge">Aceptada</div>' : '';

    return `
      <div class="ponencia-card" data-id="${ponencia.id}">
        <div class="ponencia-info">
          <h3>${ponencia.titulo}</h3>
          <p>${date}</p>
          <p>${ponencia.autores.map(autor => autor.nombre).join(', ')}</p>
        </div>
        <span class="ponencia-status status-${ponencia.estado.toLowerCase()}">
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
    const misDatosBtn = document.querySelector('#datos-btn');
    misDatosBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/moderador/datosModerador';
    });

    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', async () => {
      try {
        await this.authService.signOut();
        window.location.href = '/autenticacion/iniciarSesion';
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    });

    // Mobile navigation handlers
    const misDatosBtnMobile = document.getElementById('datos-btn-mobile');
    misDatosBtnMobile?.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/moderador/datosModerador';
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
          if (this.currentActiveStatus === 'pendientes') {
            this.handlePonenciaAction(ponenciaId, EstadoPonencia.ACEPTADA);
          } else {
            this.viewPonenciaDetails(ponenciaId);
          }
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
        } else if (status === 'aceptada') {
          this.currentActiveStatus = 'aceptadas';
        }
        
        const groupedPonencias = this.groupPonencias(this.ponenciasData);
        this.updateUI(groupedPonencias);
      });
    });
  }

  private async updateWelcomeMessage(userData: any) {
    const welcomeElement = document.querySelector('.welcome');
    if (welcomeElement) {
      welcomeElement.textContent = `¡Bienvenido ${userData.datos?.nombre || 'Moderador'}!`;
    }
  }

  private async handlePonenciaAction(ponenciaId: string, newState: EstadoPonencia) {
    try {
      await this.salaService.updatePonenciaState(ponenciaId, newState);
      const moderadorId = await this.authService.getUserId();
      const sala = await this.salaService.getSala(moderadorId);
      if (sala.integrantes && sala.integrantes.length > 0) {
        this.ponenciasData = await this.salaService.getPoenciasBySala(sala.integrantes);
        const groupedPonencias = this.groupPonencias(this.ponenciasData);
        this.updateUI(groupedPonencias);
      }
    } catch (error) {
      console.error('Error handling ponencia action:', error);
      alert('Error al procesar la acción');
    }
  }

  private viewPonenciaDetails(ponenciaId: string) {
    window.location.href = `/ponencias/${ponenciaId}`;
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
      if (userData.rol !== 'moderador') {
        throw new Error('Usuario no tiene permisos de moderador');
      }

      await this.updateWelcomeMessage(userData);

      const pendingCard = document.querySelector('.stat-card[data-status="pendiente"]');
      pendingCard?.classList.add('active');

      this.setupEventListeners();

      console.log('user.uid', user.uid);
      const sala = await this.salaService.getSala(user.uid);
      console.log('sala', sala);
      if (sala.integrantes && sala.integrantes.length > 0) {
        this.ponenciasData = await this.salaService.getPoenciasBySala(sala.integrantes);
        const groupedPonencias = this.groupPonencias(this.ponenciasData);
        this.updateUI(groupedPonencias);
      }

      this.salaService.setupRealtimeUpdates(user.uid, async (updatedSala) => {
        if (updatedSala.integrantes?.length) {
          this.ponenciasData = await this.salaService.getPoenciasBySala(updatedSala.integrantes);
          const groupedPonencias = this.groupPonencias(this.ponenciasData);
          this.updateUI(groupedPonencias);
        } else {
          this.ponenciasData = [];
          this.updateUI({
            pendientes: [],
            aceptadas: []
          });
        }
      });
    } catch (error) {
      console.error('Error initializing moderador page:', error);
    }
  }
}

export async function initializeSalaPage(): Promise<void> {
  const dashboard = new SalaManager();
  console.log('initializeSalaPage');
  await dashboard.initialize();
}