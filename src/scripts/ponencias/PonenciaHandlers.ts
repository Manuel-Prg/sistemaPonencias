import { showSuccess, showError, showWarning } from '../../utils/notifications';

// src/components/revisor/ponencia.ts
export class PonenciaHandlers {
  private ponenciaId: string;
  private ponenciaCard: HTMLElement | null;
  private comentariosCard: HTMLElement | null;
  private container: HTMLElement | null;
  private btnAceptarConObs: HTMLElement | null;
  private btnGuardarObs: HTMLElement | null;
  private btnCancelarObs: HTMLElement | null;
  private dialogOverlay: HTMLElement | null;
  private dialogTitle: HTMLElement | null;
  private dialogComments: HTMLTextAreaElement | null;
  private dialogAccept: HTMLElement | null;
  private dialogCancel: HTMLElement | null;
  private btnAceptar: HTMLElement | null;
  private btnRechazar: HTMLElement | null;
  private observacionesText: HTMLTextAreaElement | null;
  private regresarBtn: HTMLElement | null;

  constructor(ponenciaId: string) {
    this.ponenciaId = ponenciaId;
    this.ponenciaCard = document.querySelector('.ponencia-card');
    this.comentariosCard = document.getElementById('comentariosCard');
    this.container = document.querySelector('.container');
    this.btnAceptarConObs = document.querySelector('.btn-accept-with-obs');
    this.btnGuardarObs = document.getElementById('guardarObservaciones');
    this.btnCancelarObs = document.getElementById('cancelarObservaciones');
    this.dialogOverlay = document.getElementById('dialogOverlay');
    this.dialogTitle = document.getElementById('dialogTitle');
    this.dialogComments = document.getElementById('dialogComments') as HTMLTextAreaElement;
    this.dialogAccept = document.getElementById('dialogAccept');
    this.dialogCancel = document.getElementById('dialogCancel');
    this.btnAceptar = document.querySelector('.btn-accept');
    this.btnRechazar = document.querySelector('.btn-reject');
    this.observacionesText = document.getElementById('observacionesText') as HTMLTextAreaElement;
    this.regresarBtn = document.getElementById('logout-btn');

    this.initEventListeners();
  }

  private initElements(): void {
    this.ponenciaCard = document.querySelector('.ponencia-card');
    this.comentariosCard = document.getElementById('comentariosCard');
    this.container = document.querySelector('.container');
    this.observacionesText = document.getElementById('observacionesText') as HTMLTextAreaElement;
  }

  private initEventListeners(): void {
    // Mostrar panel de observaciones
    // Botón de aceptar con observaciones
    const btnAceptarConObs = document.querySelector('.btn-accept-with-obs');
    btnAceptarConObs?.addEventListener('click', () => this.mostrarPanelObservaciones());


    // Guardar observaciones
    const btnGuardarObs = document.getElementById('guardarObservaciones');
    btnGuardarObs?.addEventListener('click', () => this.guardarObservaciones());

    // Cancelar observaciones
    const btnCancelarObs = document.getElementById('cancelarObservaciones');
    btnCancelarObs?.addEventListener('click', () => this.ocultarPanelObservaciones());

    // Aceptar ponencia
    this.btnAceptar?.addEventListener('click', () => this.mostrarDialogo('Aceptar ponencia', 'APROBADA'));

    // Rechazar ponencia
    this.btnRechazar?.addEventListener('click', () => this.mostrarDialogo('Rechazar ponencia', 'RECHAZADA'));

    // Botones del diálogo
    this.dialogAccept?.addEventListener('click', () => this.procesarAccion());
    this.dialogCancel?.addEventListener('click', () => this.cerrarDialogo());

    // Botón regresar
    this.regresarBtn?.addEventListener('click', () => this.regresar());
  }

  private mostrarPanelObservaciones(): void {
    this.container?.classList.add('with-comments');
    this.comentariosCard?.classList.add('visible');
    this.observacionesText?.focus();
  }

  private ocultarPanelObservaciones(): void {
    this.container?.classList.remove('with-comments');
    this.comentariosCard?.classList.remove('visible');
    if (this.observacionesText) {
      this.observacionesText.value = '';
    }
  }

  private guardarObservaciones(): void {
    const observaciones = this.observacionesText?.value.trim();

    if (!observaciones) {
      showWarning('Por favor, ingrese sus observaciones antes de guardar.');
      return;
    }
    // Aquí iría la lógica para guardar las observaciones
    console.log('Guardando observaciones:', observaciones);
    this.enviarEvaluacion('APROBADA_CON_OBSERVACIONES', observaciones);
    this.ocultarPanelObservaciones();
  }

  private mostrarDialogo(titulo: string, estado: string): void {
    if (this.dialogOverlay && this.dialogTitle) {
      this.dialogTitle.textContent = titulo;
      this.dialogOverlay.setAttribute('data-estado', estado);
      this.dialogOverlay.style.display = 'flex';

      if (this.dialogComments) {
        this.dialogComments.focus();
      }
    }
  }

  private cerrarDialogo(): void {
    if (this.dialogOverlay) {
      this.dialogOverlay.style.display = 'none';
      if (this.dialogComments) {
        this.dialogComments.value = '';
      }
    }
  }

  private procesarAccion(): void {
    if (this.dialogOverlay) {
      const estado = this.dialogOverlay.getAttribute('data-estado') || '';
      const comentarios = this.dialogComments?.value || '';

      this.enviarEvaluacion(estado, comentarios);
      this.cerrarDialogo();
    }
  }

  private async enviarEvaluacion(estado: string, comentarios: string): Promise<void> {
    try {
      // Simulación de envío a API
      console.log(`Enviando evaluación: Ponencia ${this.ponenciaId}, Estado: ${estado}, Comentarios: ${comentarios}`);

      // Simulación de redirección después de guardar
      setTimeout(() => {
        showSuccess(`Ponencia ${estado} exitosamente`);
        this.regresar();
      }, 1000);
    } catch (error) {
      console.error('Error al enviar evaluación:', error);
      showError('Ocurrió un error al procesar la solicitud. Por favor, intente de nuevo.');
    }
  }

  private regresar(): void {
    // Redireccionar a la página anterior o a la lista de ponencias
    window.history.back();
    // Alternativa: window.location.href = '/ponencias';
  }
}