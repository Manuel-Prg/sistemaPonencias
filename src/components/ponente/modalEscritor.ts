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
    this.ponenciaBtn?.addEventListener('click', () => this.showPonenciaModal());
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
  private showPonenciaModal(): void {
    if (this.ponenciaModal) {
      this.ponenciaModal.style.display = 'block';
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
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
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