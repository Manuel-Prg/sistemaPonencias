// types.ts
interface UploadResponse {
  success: boolean;
  message: string;
  fileUrl?: string;
}

import { showError as showErrorNotification, showSuccess as showSuccessNotification } from '../../utils/notifications';

// modalHandlers.ts
export class ModalHandlers {
  // Modal de datos de ponencia
  private ponenciaModal: HTMLElement | null;
  private ponenciaBtn: HTMLElement | null;
  private closePonenciaBtn: HTMLElement | null;

  // Modal de subida de archivos
  private uploadModal: HTMLElement | null;
  private closeUploadBtn: HTMLElement | null;
  private uploadBtn: HTMLElement | null;
  private fileInput: HTMLInputElement | null;
  private selectedFileName: HTMLElement | null;
  private uploadForm: HTMLFormElement | null;
  private readonly validFileTypes: string[];

  constructor() {
    // Inicializar elementos del modal de ponencia
    this.ponenciaModal = document.getElementById('modalForm');
    this.ponenciaBtn = document.querySelector('[data-action="datosPonencia"]');
    this.closePonenciaBtn = document.getElementById('closeButton');

    // Inicializar elementos del modal de subida
    this.uploadModal = document.getElementById('uploadModal');
    this.closeUploadBtn = document.getElementById('closeUploadModal');
    this.uploadBtn = document.querySelector('[data-action="subir"]');
    this.fileInput = document.getElementById('fileInput') as HTMLInputElement;
    this.selectedFileName = document.getElementById('selectedFileName');
    this.uploadForm = document.getElementById('uploadForm') as HTMLFormElement;
    this.validFileTypes = ['.pdf', '.doc', '.docx'];

    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    // Event listeners para modal de ponencia
    this.ponenciaBtn?.addEventListener('click', async () => await this.showPonenciaModal());
    this.closePonenciaBtn?.addEventListener('click', () => this.hidePonenciaModal());

    // Event listeners para modal de subida
    this.uploadBtn?.addEventListener('click', () => this.showUploadModal());
    this.closeUploadBtn?.addEventListener('click', () => this.hideUploadModal());

    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (event: MouseEvent) => {
      if (event.target === this.ponenciaModal) {
        this.hidePonenciaModal();
      }
      if (event.target === this.uploadModal) {
        this.hideUploadModal();
      }
    });

    // Mostrar nombre del archivo seleccionado
    this.fileInput?.addEventListener('change', (event: Event) => {
      this.handleFileSelection(event);
    });

    // Manejar envío del formulario
    this.uploadForm?.addEventListener('submit', async (event: Event) => {
      event.preventDefault();
      await this.handleFormSubmission();
    });
  }

  // Métodos para modal de ponencia
  private async showPonenciaModal(): Promise<void> {
    if (this.ponenciaModal) {
      this.ponenciaModal.style.display = 'block';

      // Cargar datos reales de la ponencia
      const { PonenciaDataLoader } = await import('../../lib/services/ponencias/ponenciaData.service');
      const loader = new PonenciaDataLoader();
      await loader.renderPonenciaData('modalForm');
    }
  }

  private hidePonenciaModal(): void {
    if (this.ponenciaModal) {
      this.ponenciaModal.style.display = 'none';
    }
  }

  // Métodos para modal de subida
  private showUploadModal(): void {
    if (this.uploadModal) {
      this.uploadModal.style.display = 'block';
    }
  }

  private hideUploadModal(): void {
    if (this.uploadModal) {
      this.uploadModal.style.display = 'none';
    }
  }

  private handleFileSelection(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file && this.selectedFileName) {
      this.selectedFileName.textContent = `Archivo seleccionado: ${file.name}`;
    } else if (this.selectedFileName) {
      this.selectedFileName.textContent = '';
    }
  }

  private validateFileType(file: File): boolean {
    const fileExtension = file.name
      .substring(file.name.lastIndexOf('.'))
      .toLowerCase();
    return this.validFileTypes.includes(fileExtension);
  }

  private async handleFormSubmission(): Promise<void> {
    const file = this.fileInput?.files?.[0];

    if (!file) {
      this.showError('Por favor selecciona un archivo');
      return;
    }

    if (!this.validateFileType(file)) {
      this.showError('Por favor selecciona un archivo PDF o Word');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.uploadFile(formData);

      if (response.success) {
        this.showSuccess('Archivo subido exitosamente');
        this.resetForm();
      } else {
        throw new Error(response.message || 'Error al subir el archivo');
      }
    } catch (error) {
      this.showError(`Error al subir el archivo: ${(error as Error).message}`);
    }
  }

  private async uploadFile(formData: FormData): Promise<UploadResponse> {
    try {
      // Obtener el ID de la ponencia del usuario actual
      const { AuthService } = await import('../../lib/services/auth/auth.service');
      const auth = new AuthService();
      const user = await new Promise<any>((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          resolve(user);
        });
      });

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener la ponencia del usuario
      const { PonenciaService } = await import('../../lib/services/ponencias/ponencia.service');
      const service = new PonenciaService();
      const ponencias = await service.getPonencias();
      const userPonencia = ponencias.find(p => p.userId === user.uid);

      if (!userPonencia) {
        throw new Error('No se encontró una ponencia asociada a tu usuario');
      }

      // Agregar el ID de la ponencia al formData
      formData.append('ponenciaId', userPonencia.id);

      // Obtener token de autenticación
      const token = await user.getIdToken();

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  }

  private showError(message: string): void {
    showErrorNotification(message);
  }

  private showSuccess(message: string): void {
    showSuccessNotification(message);
    setTimeout(() => {
      this.hideUploadModal();
    }, 1500);
  }

  private resetForm(): void {
    this.uploadForm?.reset();
    if (this.selectedFileName) {
      this.selectedFileName.textContent = '';
    }
  }
}