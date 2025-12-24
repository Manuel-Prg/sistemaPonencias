import { PonenciaService } from '../../../lib/services/ponencias/ponencia.service';
import { AuthService } from '../../../lib/services/auth/auth.service';
import type { Ponencia } from '../../../lib/models/ponencia';
import { showError } from '../../../utils/notifications';

export class PonenciaDataLoader {
    private ponenciaService: PonenciaService;
    private authService: AuthService;

    constructor() {
        this.ponenciaService = new PonenciaService();
        this.authService = new AuthService();
    }

    /**
     * Obtiene la ponencia del usuario autenticado actual
     */
    async getUserPonencia(): Promise<Ponencia | null> {
        try {
            // Obtener usuario autenticado
            const user: any = await new Promise((resolve) => {
                const unsubscribe = this.authService.onAuthStateChanged((user) => {
                    unsubscribe();
                    resolve(user);
                });
            });

            if (!user) {
                showError('Usuario no autenticado');
                return null;
            }

            // Obtener todas las ponencias y filtrar por userId
            const ponencias = await this.ponenciaService.getPonencias();
            const userPonencia = ponencias.find(p => p.userId === user.uid);

            if (!userPonencia) {
                return null;
            }

            return userPonencia;
        } catch (error) {
            console.error('Error getting user ponencia:', error);
            showError('Error al cargar los datos de la ponencia');
            return null;
        }
    }

    /**
     * Formatea la fecha de creación de la ponencia
     */
    formatDate(date: Date | any): string {
        if (!date) return 'No disponible';

        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            return dateObj.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    }

    /**
     * Obtiene el texto del estado en español
     */
    getEstadoText(estado: string): string {
        const estados: { [key: string]: string } = {
            'pendiente': 'Pendiente de revisión',
            'aceptada': 'Aceptada',
            'rechazada': 'Rechazada',
            'aceptada con correcciones': 'Aceptada con correcciones'
        };

        return estados[estado] || estado;
    }

    /**
     * Obtiene la clase CSS para el estado
     */
    getEstadoClass(estado: string): string {
        const classes: { [key: string]: string } = {
            'pendiente': 'estado-pendiente',
            'aceptada': 'estado-aceptada',
            'rechazada': 'estado-rechazada',
            'aceptada con correcciones': 'estado-correcciones'
        };

        return classes[estado] || 'estado-default';
    }

    /**
     * Renderiza los datos de la ponencia en el modal
     */
    async renderPonenciaData(modalId: string = 'modalForm'): Promise<void> {
        const ponencia = await this.getUserPonencia();

        if (!ponencia) {
            const modalBody = document.querySelector(`#${modalId} .modal-body`);
            if (modalBody) {
                modalBody.innerHTML = `
          <div class="no-data-message">
            <p>No se encontró una ponencia asociada a tu usuario.</p>
            <p>Por favor, registra una ponencia primero.</p>
          </div>
        `;
            }
            return;
        }

        // Obtener el contenedor del modal
        const modalBody = document.querySelector(`#${modalId} .modal-body`);
        if (!modalBody) return;

        // Formatear autores
        const autoresText = ponencia.autores
            .map(autor => autor.nombre)
            .join(', ');

        // Formatear evaluaciones
        let evaluacionesHTML = '';
        if (ponencia.evaluaciones && ponencia.evaluaciones.length > 0) {
            evaluacionesHTML = `
        <div class="evaluaciones-section">
          <h4>Evaluaciones:</h4>
          ${ponencia.evaluaciones.map((evaluacion, index) => `
            <div class="evaluacion-item">
              <p><strong>Evaluación ${index + 1}:</strong> ${this.getEstadoText(evaluacion.evaluacion)}</p>
              ${evaluacion.correcciones ? `<p class="correcciones"><em>Comentarios:</em> ${evaluacion.correcciones}</p>` : ''}
              <p class="fecha-eval"><small>Fecha: ${this.formatDate(evaluacion.fecha)}</small></p>
            </div>
          `).join('')}
        </div>
      `;
        } else {
            evaluacionesHTML = '<p class="no-evaluaciones">Aún no hay evaluaciones</p>';
        }

        // Renderizar datos
        modalBody.innerHTML = `
      <div class="ponencia-data">
        <div class="data-row">
          <span class="label">Título:</span>
          <span class="value">${ponencia.titulo}</span>
        </div>
        <div class="data-row">
          <span class="label">Estado:</span>
          <span class="value ${this.getEstadoClass(ponencia.estado)}">
            ${this.getEstadoText(ponencia.estado)}
          </span>
        </div>
        <div class="data-row">
          <span class="label">Fecha de envío:</span>
          <span class="value">${this.formatDate(ponencia.creado)}</span>
        </div>
        <div class="data-row">
          <span class="label">Autores:</span>
          <span class="value">${autoresText}</span>
        </div>
        <div class="data-row full-width">
          <span class="label">Resumen:</span>
          <p class="resumen">${ponencia.resumen}</p>
        </div>
        ${ponencia.archivoUrl ? `
          <div class="data-row">
            <span class="label">Archivo:</span>
            <a href="${ponencia.archivoUrl}" target="_blank" class="archivo-link">
              Ver archivo adjunto
            </a>
          </div>
        ` : ''}
        ${evaluacionesHTML}
      </div>
    `;
    }
}
