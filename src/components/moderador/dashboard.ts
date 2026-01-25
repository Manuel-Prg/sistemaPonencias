import { SalaService } from '../../lib/services/salas/sala.service';
import { AuthService } from '../../lib/services/auth/auth.service';
import { UserService } from '../../lib/services/user/user.service';
import { showError } from '../../utils/notifications';
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

  // Timer attributes
  private timerInterval: number | null = null;
  private timerSeconds: number = 0;
  private isTimerRunning: boolean = false;
  private timerDisplay: HTMLElement | null = null;

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
    const roomTitle = document.getElementById('room-title');
    if (roomTitle) {
      roomTitle.textContent = `Ponencias ${this.capitalizeFirst(this.currentActiveStatus)}`;
    }

    const tableBody = document.querySelector('.table-body');
    if (tableBody) {
      tableBody.innerHTML = '';

      const ponenciasToDisplay = groupedPonencias[this.currentActiveStatus];

      if (ponenciasToDisplay.length === 0) {
        tableBody.innerHTML = `
          <div class="table-row empty-row">
            <div class="cell" colspan="4">No hay ponencias ${this.currentActiveStatus}</div>
          </div>
        `;
      } else {
        ponenciasToDisplay.forEach((ponencia, index) => {
          const row = document.createElement('div');
          row.className = 'table-row';
          row.setAttribute('data-id', ponencia.id);
          // Highlight first pending ponencia
          if (this.currentActiveStatus === 'pendientes' && index === 0) {
            row.classList.add('next-up');
          }

          const date = formatTimeFromTimestamp(ponencia.creado);
          const autoresText = ponencia.autores.map(autor => autor.nombre).join(', ');

          // Checkbox de asistencia
          const asistenciaChecked = ponencia.asistencia ? 'checked' : '';
          const checkbox = `<input type="checkbox" class="attendance-check" ${asistenciaChecked} title="Marcar asistencia">`;

          // Botones de acción
          let actionButtons = '';
          if (this.currentActiveStatus === 'pendientes') {
            actionButtons = `
                  <button class="action-btn accept-btn" title="Aceptar"><i class="fas fa-check"></i></button>
                  <button class="action-btn move-end-btn" title="Mover al final"><i class="fas fa-arrow-down"></i></button>
              `;
          } else {
            actionButtons = `<button class="action-btn view-btn">Ver detalles</button>`;
          }

          row.innerHTML = `
            <div class="cell">
              <div class="ponencia-title">${ponencia.titulo}</div>
              <div class="ponencia-date">${date}</div>
               ${ponencia.notasModerador ? `<div class="ponencia-note"><i class="fas fa-sticky-note"></i> ${ponencia.notasModerador}</div>` : ''}
            </div>
            <div class="cell">${autoresText}</div>
            <div class="cell center-text">${checkbox}</div>
            <div class="cell action-cell">${actionButtons}</div>
          `;

          tableBody.appendChild(row);
        });
      }
    }
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private setupEventListeners() {
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.searchTerm = searchInput.value.toLowerCase().trim();
        this.filterAndDisplayPonencias();
      });
    }

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const row = target.closest('.table-row');

      if (!row) return;

      const ponenciaId = row.getAttribute('data-id');
      if (!ponenciaId) return;

      if (target.closest('.accept-btn')) {
        this.handlePonenciaAction(ponenciaId, EstadoPonencia.ACEPTADA);
      } else if (target.closest('.view-btn')) {
        // View details logic
      } else if (target.closest('.move-end-btn')) {
        this.handleMoveToEnd(ponenciaId);
      }
    });

    // Attendance checkbox listener using change event delegation
    document.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.classList.contains('attendance-check')) {
        const row = target.closest('.table-row');
        if (row) {
          const ponenciaId = row.getAttribute('data-id');
          if (ponenciaId) {
            this.handleAttendanceChange(ponenciaId, target.checked);
          }
        }
      }
    });

    // Timer controls
    document.getElementById('start-timer')?.addEventListener('click', () => this.startTimer());
    document.getElementById('pause-timer')?.addEventListener('click', () => this.stopTimer());
    document.getElementById('reset-timer')?.addEventListener('click', () => this.resetTimer());
  }

  // Timer Methods
  private startTimer() {
    if (!this.isTimerRunning) {
      this.isTimerRunning = true;
      this.timerInterval = window.setInterval(() => {
        this.timerSeconds++;
        this.updateTimerDisplay();
      }, 1000);
    }
  }

  private stopTimer() {
    if (this.isTimerRunning && this.timerInterval) {
      this.isTimerRunning = false;
      clearInterval(this.timerInterval);
    }
  }

  private resetTimer() {
    this.stopTimer();
    this.timerSeconds = 0;
    this.updateTimerDisplay();
  }

  private updateTimerDisplay() {
    if (!this.timerDisplay) {
      this.timerDisplay = document.getElementById('timer');
    }
    if (this.timerDisplay) {
      const hours = Math.floor(this.timerSeconds / 3600);
      const minutes = Math.floor((this.timerSeconds % 3600) / 60);
      const seconds = this.timerSeconds % 60;

      this.timerDisplay.textContent =
        `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
    }
  }

  private pad(val: number): string {
    return val < 10 ? `0${val}` : val.toString();
  }

  private async handleAttendanceChange(ponenciaId: string, isPresent: boolean) {
    try {
      // Optimistic update
      const ponencia = this.ponenciasData.find(p => p.id === ponenciaId);
      if (ponencia) ponencia.asistencia = isPresent;

      await this.salaService.updatePonenciaAttendance(ponenciaId, isPresent);
    } catch (error) {
      console.error('Error updating attendance', error);
      showError('Error al actualizar asistencia');
      // Revert if failed (optional, implementing require full state reload or targeted update)
    }
  }

  private async handleMoveToEnd(ponenciaId: string) {
    const note = prompt("Ingrese el motivo para mover al final (ej. Llegó tarde):");
    if (note === null) return; // Cancelled

    try {
      // 1. Add note
      if (note) {
        await this.salaService.addModeratorNote(ponenciaId, note);
      }

      // 2. Reorder
      const user = await this.authService.getCurrentUser();
      if (user) {
        const sala = await this.salaService.getSala(user.uid);
        if (sala.integrantes) {
          const newOrder = sala.integrantes.filter(id => id !== ponenciaId);
          newOrder.push(ponenciaId);
          await this.salaService.reorderPonencias(sala.id!, newOrder);
          // The realtime listener will update the list
        }
      }

    } catch (error) {
      console.error('Error moving ponencia:', error);
      showError('Error al mover la ponencia');
    }
  }

  private filterAndDisplayPonencias() {
    let filteredPonencias = [...this.ponenciasData];

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
      // Realtime listener handles UI update
    } catch (error) {
      console.error('Error handling ponencia action:', error);
      showError('Error al procesar la acción');
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
      await this.authService.signOut();
      window.location.href = '/';
      return;
    }

    try {
      const userData = await this.userService.getUserData(user.uid);
      if (userData.rol !== 'moderador') {
        throw new Error('Usuario no tiene permisos de moderador');
      }

      this.setupEventListeners();

      // Cargar datos iniciales
      const sala = await this.salaService.getSala(user.uid);
      if (sala.integrantes && sala.integrantes.length > 0) {
        // IMPORTANT: We need to respect the order in sala.integrantes
        const ponenciasUnordered = await this.salaService.getPonenciasBySala(sala.integrantes);
        this.ponenciasData = this.sortPonenciasByOrder(ponenciasUnordered, sala.integrantes);
        this.filterAndDisplayPonencias();
      }

      // Configurar actualizaciones en tiempo real
      this.salaService.setupRealtimeUpdates(user.uid, async (updatedSala) => {
        if (updatedSala.integrantes?.length) {
          const ponenciasUnordered = await this.salaService.getPonenciasBySala(updatedSala.integrantes);
          this.ponenciasData = this.sortPonenciasByOrder(ponenciasUnordered, updatedSala.integrantes);
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

  private sortPonenciasByOrder(ponencias: Ponencia[], orderIds: string[]): Ponencia[] {
    const ponenciaMap = new Map(ponencias.map(p => [p.id, p]));
    return orderIds
      .map(id => ponenciaMap.get(id))
      .filter((p): p is Ponencia => p !== undefined);
  }
}

export async function initializeSalaPage(): Promise<void> {
  const dashboard = new SalaManager();
  await dashboard.initialize();
}