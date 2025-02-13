export class ModalHandler {
    private modal: HTMLElement | null;
    private card: HTMLElement | null;
    private closeButton: HTMLElement | null;

    constructor() {
        // Inicializar elementos
        this.modal = document.getElementById("modalForm");
        this.card = document.querySelector('.card[data-action="datosPonencia"]');
        this.closeButton = document.getElementById("closeButton");
        
        this.initialize();
    }

    private initialize(): void {
        // Verificar si los elementos existen
        if (!this.modal || !this.card || !this.closeButton) {
            console.error("No se encontraron los elementos necesarios para el modal");
            return;
        }

        // Configurar event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        if (!this.modal || !this.card || !this.closeButton) return;

        // Abrir modal
        this.card.addEventListener("click", () => {
            this.openModal();
        });

        // Cerrar modal con el botón
        this.closeButton.addEventListener("click", () => {
            this.closeModal();
        });

        // Cerrar modal al hacer clic fuera
        window.addEventListener("click", (event: MouseEvent) => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        });
    }

    private openModal(): void {
        if (this.modal) {
            this.modal.style.display = "block";
        }
    }

    private closeModal(): void {
        if (this.modal) {
            this.modal.style.display = "none";
        }
    }
}