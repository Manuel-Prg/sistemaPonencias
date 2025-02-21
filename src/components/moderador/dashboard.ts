declare global {
  interface Window {
    handlePonenciaClick: (ponenciaId: string, estado: string) => void;
  }
}

import { SalaService } from '../../lib/services/salas/sala.service';
import { AuthService } from '../../lib/services/auth/auth.service';
import { UserService } from '../../lib/services/user/user.service';
import type { Ponencia } from '../../lib/models/ponencia';
import { EstadoPonencia } from '../../lib/models/ponencia';
import type { User as FirebaseUser } from 'firebase/auth';

export class SalaManager {
  private salaService: SalaService;
  private authService: AuthService;
  private userService: UserService;
  private ponenciasData: Ponencia[] = [];

  constructor() {
    this.salaService = new SalaService();
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  private updateUI(ponencias: Ponencia[]) {
    const tableBody = document.querySelector('.table-body');
    if (tableBody) {
      tableBody.innerHTML = this.renderPonencias(ponencias);
    }
  }

  private renderPonencias(ponencias: Ponencia[]): string {
    if (ponencias.length === 0) {
      return '<tr><td colspan="4" class="empty-message">No hay ponencias disponibles</td></tr>';
    }
    
    return ponencias.map(ponencia => this.createPonenciaRow(ponencia)).join('');
  }

  private createPonenciaRow(ponencia: Ponencia): string {
    const date = new Date(ponencia.creado).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const estadoClass = ponencia.estado.toLowerCase();
    const estadoTexto = ponencia.estado === EstadoPonencia.ACEPTADA ? 'Aceptada' : 'Pendiente';

    return `
      <tr class="ponencia-row" data-id="${ponencia.id}">
        <td>${ponencia.titulo}</td>
        <td>${ponencia.autores.map(autor => autor.nombre).join(', ')}</td>
        <td>${date}</td>
        <td>
          <span class="estado-badge estado-${estadoClass}">
            ${estadoTexto}
          </span>
        </td>
        <td>
          <button class="action-btn" onclick="handlePonenciaClick('${ponencia.id}', '${ponencia.estado}')">
            ${ponencia.estado === EstadoPonencia.PENDIENTE ? 'Aceptar' : 'Ver detalles'}
          </button>
        </td>
      </tr>
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

  private async handlePonenciaAction(ponenciaId: string, currentState: EstadoPonencia) {
    try {
      if (currentState === EstadoPonencia.PENDIENTE) {
        await this.salaService.updatePonenciaState(ponenciaId, EstadoPonencia.ACEPTADA);
        const moderadorId = await this.authService.getUserId();
        const sala = await this.salaService.getSala(moderadorId);
        if (sala.integrantes && sala.integrantes.length > 0) {
          this.ponenciasData = await this.salaService.getPonenciasBySala(sala.integrantes);
          this.updateUI(this.ponenciasData);
        }
      } else {
        this.viewPonenciaDetails(ponenciaId);
      }
    } catch (error) {
      console.error('Error handling ponencia action:', error);
      alert('Error al procesar la acción');
    }
  }

  private viewPonenciaDetails(ponenciaId: string) {
    window.location.href = `/ponencias/${ponenciaId}`;
  }

  private async updateWelcomeMessage(userData: any) {
    const welcomeElement = document.querySelector('#room-title');
    if (welcomeElement) {
      welcomeElement.textContent = `¡Bienvenido ${userData.datos?.nombre}, Esta es la Sala 1!`;
    }
  }

  public async initialize(): Promise<void> {
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
      this.setupNavigationHandlers();

      // Load initial data
      const sala = await this.salaService.getSala(user.uid);
      if (sala.integrantes && sala.integrantes.length > 0) {
        console.log(sala.integrantes);
        this.ponenciasData = await this.salaService.getPonenciasBySala(sala.integrantes);
        this.updateUI(this.ponenciasData);
      }

      // Setup realtime updates for the sala
      this.salaService.setupRealtimeUpdates(user.uid, async (updatedSala) => {
        if (updatedSala.integrantes?.length) {
          this.ponenciasData = await this.salaService.getPonenciasBySala(updatedSala.integrantes);
          this.updateUI(this.ponenciasData);
        } else {
          this.ponenciasData = [];
          this.updateUI([]);
        }
      });

      // Setup global handler for ponencia actions
      window.handlePonenciaClick = (ponenciaId: string, estado: string) => {
        this.handlePonenciaAction(ponenciaId, estado as EstadoPonencia);
      };
    } catch (error) {
      console.error('Error initializing moderador page:', error);
    }
  }
}

export async function initializeSalaPage(): Promise<void> {
  const dashboard = new SalaManager();
  await dashboard.initialize();
}