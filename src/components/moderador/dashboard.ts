import { SalaService } from '../../lib/services/salas/sala.service';
import { AuthService } from '../../lib/services/auth/auth.service';
import { UserService } from '../../lib/services/user/user.service';
import type { Ponencia } from '../../lib/models/ponencia';
import { EstadoPonencia } from '../../lib/models/ponencia';
import type { User as FirebaseUser } from 'firebase/auth';
import { formatTimeFromTimestamp } from '../../lib/utils/formatters';

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
  private searchTerm: string = '';

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
    // Actualizar título de la página
    const roomTitle = document.getElementById('room-title');
    if (roomTitle) {
      roomTitle.textContent = `Ponencias ${this.capitalizeFirst(this.currentActiveStatus)}`;
    }

    // Actualizar tabla de ponencias
    const tableBody = document.querySelector('.table-body');
    if (tableBody) {
      tableBody.innerHTML = ''; // Limpiar tabla

      const ponenciasToDisplay = groupedPonencias[this.currentActiveStatus];

      if (ponenciasToDisplay.length === 0) {
        tableBody.innerHTML = `
          <div class="table-row empty-row">
            <div class="cell" colspan="3">No hay ponencias ${this.currentActiveStatus}</div>
          </div>
        `;
      } else {
        ponenciasToDisplay.forEach(ponencia => {
          const row = document.createElement('div');
          row.className = 'table-row';
          row.setAttribute('data-id', ponencia.id);

          // Formatear fecha
          const date = formatTimeFromTimestamp(ponencia.creado);

          // Crear lista de autores
          const autoresText = ponencia.autores.map(autor => autor.nombre).join(', ');

          // Determinar tipo de botón según estado
          const actionButton = this.currentActiveStatus === 'pendientes'
            ? `<button class="action-btn accept-btn">Aceptar</button>`
            : `<button class="action-btn view-btn">Ver detalles</button>`;

          row.innerHTML = `
            <div class="cell">
              <div class="ponencia-title">${ponencia.titulo}</div>
              <div class="ponencia-date">${date}</div>
            </div>
            <div class="cell">${autoresText}</div>
            <div class="cell action-cell">${actionButton}</div>
          `;

          tableBody.appendChild(row);
        });
      }
    }

    // Actualizar botones de filtro si existen
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      const status = btn.getAttribute('data-status');
      if (status === this.currentActiveStatus) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private setupNavigationHandlers() {
    // Añadir código de navegación si es necesario
  }

  private setupEventListeners() {
    // Configurar manejador de búsqueda
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.searchTerm = searchInput.value.toLowerCase().trim();
        this.filterAndDisplayPonencias();
      });
    }

    // Configurar manejadores para botones de filtro (si se agregan a la vista)
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const status = btn.getAttribute('data-status');
        if (status === 'pendientes' || status === 'aceptadas') {
          this.currentActiveStatus = status;
          this.filterAndDisplayPonencias();

          // Actualizar estado activo de los botones
          filterButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });

    // Delegación de eventos para manejar acciones en filas
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Manejar botón "Aceptar"
      if (target.classList.contains('accept-btn')) {
        const row = target.closest('.table-row');
        if (row) {
          const ponenciaId = row.getAttribute('data-id');
          if (ponenciaId) {
            this.handlePonenciaAction(ponenciaId, EstadoPonencia.ACEPTADA);
          }
        }
      }

      // Manejar botón "Ver detalles"
      else if (target.classList.contains('view-btn')) {
        const row = target.closest('.table-row');
        if (row) {
          const ponenciaId = row.getAttribute('data-id');
          if (ponenciaId) {
            this.viewPonenciaDetails(ponenciaId);
          }
        }
      }
    });
  }

  private filterAndDisplayPonencias() {
    let filteredPonencias = [...this.ponenciasData];

    // Aplicar filtro de búsqueda si existe
    if (this.searchTerm) {
      filteredPonencias = filteredPonencias.filter(ponencia =>
        ponencia.titulo.toLowerCase().includes(this.searchTerm) ||
        ponencia.autores.some(autor => autor.nombre.toLowerCase().includes(this.searchTerm))
      );
    }

    const groupedPonencias = this.groupPonencias(filteredPonencias);
    this.updateUI(groupedPonencias);
  }

  private async handlePonenciaAction(ponenciaId: string, newState: EstadoPonencia) {
    try {
      await this.salaService.updatePonenciaState(ponenciaId, newState);
      const moderadorId = await this.authService.getUserId();
      const sala = await this.salaService.getSala(moderadorId);
      if (sala.integrantes && sala.integrantes.length > 0) {
        this.ponenciasData = await this.salaService.getPonenciasBySala(sala.integrantes);
        this.filterAndDisplayPonencias();
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
      window.location.href = '/';
      return;
    }

    try {
      const userData = await this.userService.getUserData(user.uid);
      if (userData.rol !== 'moderador') {
        throw new Error('Usuario no tiene permisos de moderador');
      }

      // Añadir botones de filtro a la interfaz

      // Configurar listeners de eventos
      this.setupEventListeners();

      // Cargar datos iniciales
      const sala = await this.salaService.getSala(user.uid);
      if (sala.integrantes && sala.integrantes.length > 0) {
        this.ponenciasData = await this.salaService.getPonenciasBySala(sala.integrantes);
        this.filterAndDisplayPonencias();
      }

      // Configurar actualizaciones en tiempo real
      this.salaService.setupRealtimeUpdates(user.uid, async (updatedSala) => {
        if (updatedSala.integrantes?.length) {
          this.ponenciasData = await this.salaService.getPonenciasBySala(updatedSala.integrantes);
          this.filterAndDisplayPonencias();
        } else {
          this.ponenciasData = [];
          this.filterAndDisplayPonencias();
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