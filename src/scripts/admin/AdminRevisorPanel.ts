import { RevisorService } from '../../lib/services/revisor/revisor.services';
import type { Revisor } from '../../lib/models/revisor';
import type { Ponencia } from '../../lib/models/ponencia';

/**
 * Clase que gestiona la visualización de los revisores y sus ponencias asignadas
 */
class RevisorCards {
  private revisorService: RevisorService;
  private container: HTMLElement | null;
  private ponenciasMap: Map<string, Ponencia>;

  constructor() {
    this.revisorService = new RevisorService();
    this.container = document.getElementById('presentations-container');
    this.ponenciasMap = new Map<string, Ponencia>();
  }

  /* MODAL LOGIC */
  private modalContainer: HTMLElement | null = null;
  private currentRevisorId: string | null = null;
  /**
   * Inicializa la carga y visualización de revisores y el modal
   */
  public async init(): Promise<void> {
    try {
      this.crearModal();
      await this.cargarRevisores();
      this.configurarToggleButtons();
    } catch (error) {
      this.mostrarError('Error al cargar los datos. Por favor intente nuevamente.');
      console.error('Error inicializando revisor cards:', error);
    }
  }

  private crearModal(): void {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Asignar Ponencia</h3>
            <button class="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <div id="ponencias-list" class="ponencias-selector">
              Cargando ponencias...
            </div>
          </div>
        </div>
      `;
    document.body.appendChild(modal);
    this.modalContainer = modal;

    // Cerrar modal
    modal.querySelector('.close-modal')?.addEventListener('click', () => {
      this.cerrarModal();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.cerrarModal();
    });
  }

  private cerrarModal(): void {
    if (this.modalContainer) {
      this.modalContainer.style.display = 'none';
      this.currentRevisorId = null;
    }
  }

  private async abrirModalAsignacion(revisorId: string): Promise<void> {
    if (!this.modalContainer) return;
    this.currentRevisorId = revisorId;

    const ponenciasList = this.modalContainer.querySelector('#ponencias-list');
    if (ponenciasList) {
      ponenciasList.innerHTML = '<div class="loading">Cargando ponencias disponibles...</div>';
    }

    this.modalContainer.style.display = 'flex';

    try {
      // Cargar TODAS las ponencias (optimizar esto en el futuro)
      // Nota: Deberíamos tener un método en el servicio para obtener ponencias 'pendientes de asignación'
      // Por ahora simularemos con IDs conocidos o cargando un lote
      const { PonenciaService } = await import('../../lib/services/ponencias/ponencia.service');
      const ponenciaService = new PonenciaService();
      const ponencias = await ponenciaService.getPonencias(); // Necesitamos un método getAll o similar

      // Filtrar ponencias que YA están asignadas a este revisor
      // Y priorizar las que tienen menos revisores
      const revisores = await this.revisorService.getRevisores();
      const currentRevisor = revisores.find(r => r.id === revisorId);

      if (!currentRevisor) throw new Error("Revisor no encontrado");

      const asignadasIds = currentRevisor.ponenciasAsignadas?.map(p => p.ponencia) || [];
      const disponibles = ponencias.filter(p => !asignadasIds.includes(p.id));

      if (disponibles.length === 0) {
        if (ponenciasList) ponenciasList.innerHTML = '<p>No hay ponencias disponibles para asignar.</p>';
        return;
      }

      if (ponenciasList) {
        ponenciasList.innerHTML = '';
        const list = document.createElement('div');
        list.className = 'list-group';

        disponibles.forEach(p => {
          const item = document.createElement('div');
          item.className = 'list-item';
          item.innerHTML = `
                      <div class="ponencia-info">
                          <strong>${p.titulo}</strong>
                          <small>${p.estado}</small>
                      </div>
                      <button class="assign-btn">Asignar</button>
                  `;
          item.querySelector('.assign-btn')?.addEventListener('click', () => this.asignarPonencia(p.id));
          list.appendChild(item);
        });
        ponenciasList.appendChild(list);
      }

    } catch (error) {
      console.error("Error al cargar ponencias para asignar", error);
      if (ponenciasList) ponenciasList.innerHTML = '<p class="error">Error al cargar ponencias.</p>';
    }
  }

  private async asignarPonencia(ponenciaId: string) {
    if (!this.currentRevisorId) return;

    try {
      const { showSuccess, showError } = await import('../../utils/notifications');

      await this.revisorService.assignPonenciaToRevisor(this.currentRevisorId, ponenciaId);

      showSuccess('Ponencia asignada correctamente (max 2)');
      this.cerrarModal();
      this.cargarRevisores(); // Recargar UI
    } catch (error: any) {
      const { showError } = await import('../../utils/notifications');
      showError(error.message || 'Error al asignar ponencia');
    }
  }


  /**
   * Carga los revisores y sus ponencias desde el servicio
   */
  private async cargarRevisores(): Promise<void> {
    if (!this.container) return;

    const revisores = await this.revisorService.getRevisores();

    // Limpiar el contenedor
    this.container.innerHTML = '';

    // Verificar si hay revisores
    if (revisores.length === 0) {
      this.container.innerHTML = '<div class="no-data">No hay revisores disponibles</div>';
      return;
    }

    // Obtener IDs de ponencias para cargarlas en batch
    const ponenciasIds = this.obtenerPonenciasIds(revisores);

    // Cargar ponencias y crear el mapa
    if (ponenciasIds.length > 0) {
      const ponencias = await this.revisorService.getPresentations(ponenciasIds);
      ponencias.forEach(ponencia => {
        this.ponenciasMap.set(ponencia.id, ponencia);
      });
    }

    // Generar las cards
    this.renderizarRevisores(revisores);
  }

  /**
   * Extrae todos los IDs de ponencias asignadas a los revisores
   */
  private obtenerPonenciasIds(revisores: Revisor[]): string[] {
    const ids: string[] = [];

    revisores.forEach(revisor => {
      revisor.ponenciasAsignadas?.forEach(asignacion => {
        if (asignacion.ponencia && !ids.includes(asignacion.ponencia)) {
          ids.push(asignacion.ponencia);
        }
      });
    });

    return ids;
  }

  /**
   * Renderiza las cards de revisores en el DOM
   */
  private renderizarRevisores(revisores: Revisor[]): void {
    if (!this.container) return;

    revisores.forEach((revisor, index) => {
      const card = this.crearRevisorCard(revisor, index);
      this.container?.appendChild(card);
    });
  }

  /**
   * Crea el elemento DOM para una card de revisor
   */
  private crearRevisorCard(revisor: Revisor, index: number): HTMLElement {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'presentation-card';

    const cardId = `presentation-${index}`;
    // Verificar si puede recibir más ponencias
    const numAsignadas = revisor.ponenciasAsignadas?.length || 0;
    const puedeAsignar = numAsignadas < 2;
    const btnDisabled = !puedeAsignar ? 'disabled' : '';
    const btnTitle = !puedeAsignar ? 'Límite de 2 ponencias alcanzado' : 'Asignar nueva ponencia';

    cardDiv.innerHTML = `
      <div class="presentation-header">
        <h3 class="presentation-name">${revisor.datos?.nombre || 'Revisor sin nombre'}</h3>
        <div class="presentation-actions">
          <button class="convert-btn add-btn" data-revisor-id="${revisor.id}" ${btnDisabled} title="${btnTitle}" style="${!puedeAsignar ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-circle"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            Agregar
          </button>
          <button class="toggle-btn" data-id="${cardId}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>
      </div>
      <div class="presentation-details" id="${cardId}" style="display: none;">
        <table class="presentation-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${this.generarFilasPonencias(revisor)}
          </tbody>
        </table>
      </div>
    `;

    // Listener para el botón Agregar
    if (puedeAsignar) {
      cardDiv.querySelector('.add-btn')?.addEventListener('click', () => {
        this.abrirModalAsignacion(revisor.id);
      });
    }

    return cardDiv;
  }

  /**
   * Genera el HTML para las filas de la tabla de ponencias
   */
  /**
   * 
   *SOLO CAMBIE LOS SVG :C
   */
  private generarFilasPonencias(revisor: Revisor): string {
    if (!revisor.ponenciasAsignadas || revisor.ponenciasAsignadas.length === 0) {
      return `
        <tr>
          <td colspan="2" style="text-align: center; color: rgba(255, 255, 255, 0.6);">
            No hay ponencias asignadas
          </td>
        </tr>
      `;
    }

    return revisor.ponenciasAsignadas.map(asignacion => {
      const ponencia = this.ponenciasMap.get(asignacion.ponencia);
      const nombrePonencia = ponencia?.titulo || 'Ponencia sin título';
      const estado = asignacion.estado || 'pendiente';

      const estadoClass = this.obtenerClaseEstado(estado);
      /**
     * 
     *SOLO CAMBIE LOS SVG :C
    */
      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text" style="opacity: 0.7;">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
              ${nombrePonencia}
            </div>
          </td>
          <td><span class="status-badge ${estadoClass}">${this.capitalizarPrimeraLetra(estado)}</span></td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Determina la clase CSS para el estado de la ponencia
   */
  private obtenerClaseEstado(estado: string): string {
    const estadoLower = estado.toLowerCase();

    if (estadoLower === 'aprobado') return 'approved';
    if (estadoLower === 'rechazado') return 'rejected';
    return 'pending';
  }

  /**
   * Capitaliza la primera letra de un texto
   */
  private capitalizarPrimeraLetra(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  /**
   * Configura los botones de toggle para mostrar/ocultar detalles
   */
  private configurarToggleButtons(): void {
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    toggleButtons.forEach(button => {
      button.addEventListener('click', () => {
        const detailsId = button.getAttribute('data-id');
        if (!detailsId) return;

        const detailsElement = document.getElementById(detailsId);
        if (!detailsElement) return;

        const isHidden = detailsElement.style.display === 'none';
        detailsElement.style.display = isHidden ? 'block' : 'none';

        // Actualizar el estado del botón
        button.setAttribute('data-active', isHidden ? 'true' : 'false');

        // Rotar el icono
        const icon = button.querySelector('svg');
        if (icon) {
          icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0)';
        }
      });
    });
  }

  /**
   * Muestra un mensaje de error en el contenedor
   */
  private mostrarError(mensaje: string): void {
    if (this.container) {
      this.container.innerHTML = `<div class="error">${mensaje}</div>`;
    }
  }
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
  const revisorCards = new RevisorCards();
  revisorCards.init();
});