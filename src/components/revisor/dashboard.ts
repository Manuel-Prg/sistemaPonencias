// File: dashboard.ts
import { AuthService } from "../../lib/services/auth/auth.service";
import { UserService } from "../../lib/services/user/user.service";
import { RevisorService } from "../../lib/services/revisor/revisor.services";
import type { Ponencia, EstadoPonencia, PonenciaAsignada } from "../../lib/models/ponencia";
import type { User as FirebaseUser } from 'firebase/auth';
interface GroupedPonencias {
  pendientes: Ponencia[];
  aceptadas: Ponencia[];
  rechazadas: Ponencia[];
}

export class DashboardManager {
  private authService: AuthService;
  private userService: UserService;
  private revisorService: RevisorService;
  private ponenciasData: Ponencia[] = [];

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
    this.revisorService = new RevisorService();
  }

  private groupPonencias(ponencias: Ponencia[]): GroupedPonencias {
    return {
      pendientes: ponencias.filter(p => p.estado === 'pendiente'),
      aceptadas: ponencias.filter(p => 
        p.estado === 'aceptada' || 
        p.estado === 'aceptada con correcciones'
      ),
      rechazadas: ponencias.filter(p => p.estado === 'rechazada')
    };
  }

  private updateUI(groupedPonencias: GroupedPonencias) {
    console.log('Actualizando UI con:', groupedPonencias);
    
    // Update each column
    Object.entries(groupedPonencias).forEach(([status, ponencias]) => {
        // Corregir el selector para que coincida con los IDs del HTML
        const column = document.getElementById(`${status}-column`);
        console.log(`Buscando columna ${status}:`, column);
        
        if (!column) {
            console.warn(`No se encontró la columna para ${status}`);
            return;
        }

        column.innerHTML = ponencias.length > 0 
            ? ponencias.map((ponencia: Ponencia) => this.createPonenciaCard(ponencia)).join('')
            : '<p class="empty-message">No hay ponencias en esta categoría</p>';
        
        // Actualizar contador
        const counter = document.getElementById(`${status}-counter`);
        if (counter) {
            counter.textContent = ponencias.length.toString();
        }
    });

    // También actualizar los contadores de las stats cards
    const statsCounters = {
        pendiente: document.getElementById('pendiente-count'),
        aprobada: document.getElementById('aprobada-count'),
        rechazada: document.getElementById('rechazada-count')
    };

    Object.entries(statsCounters).forEach(([status, element]) => {
        if (element) {
            const count = status === 'aprobada' 
                ? groupedPonencias.aceptadas.length 
                : groupedPonencias[status as keyof GroupedPonencias].length;
            element.textContent = count.toString();
        }
    });
}

  private createPonenciaCard(ponencia: Ponencia): string {
    
    const date = new Date(ponencia.creado).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const statusBadge = ponencia.estado === 'aceptada con correcciones'
      ? '<div class="status-badge">Con correcciones</div>'
      : '';

    return `
      <div class="ponencia-card" data-id="${ponencia.id}">
        ${statusBadge}
        <h4>${ponencia.titulo}</h4>
        <p class="date"><strong>Fecha:</strong> ${date}</p>
        <p class="summary">${ponencia.resumen.substring(0, 150)}...</p>
        <button class="ver-detalle-btn" data-id="${ponencia.id}">Ver Detalles</button>
      </div>
    `;
  }

  private setupEventListeners() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('ver-detalle-btn')) {
        const ponenciaId = target.getAttribute('data-id');
        if (ponenciaId) {
          this.handleVerDetalles(ponenciaId);
        }
      }
    });
  }

  private async handleVerDetalles(ponenciaId: string) {
    // Implement your detail view logic here
    console.log('Ver detalles de ponencia:', ponenciaId);
  }

  public async initialize(): Promise<void> {
    console.log('initialize');
    
    // Esperar a que Firebase confirme el estado de autenticación
    const user = await new Promise<FirebaseUser | null>((resolve) => {
        const unsubscribe = this.authService.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });

    console.log('user after auth state check:', user);
    
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
            aceptadas: [],
            rechazadas: []
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