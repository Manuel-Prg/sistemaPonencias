/**
 * Custom Notification System
 * Replaces native alert() and confirm() with styled notifications
 */

export interface ToastOptions {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number; // milliseconds, default 3000
    position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

export interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
}

// Toast Manager Class
class ToastManager {
    private container: HTMLElement | null = null;
    private toasts: Set<HTMLElement> = new Set();

    private ensureContainer(): void {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            // Use Popover API to promote to Top Layer (above dialogs)
            try {
                this.container.setAttribute('popover', 'manual');
                document.body.appendChild(this.container);
                if (typeof this.container.showPopover === 'function') {
                    this.container.showPopover();
                }
            } catch (e) {
                // Fallback for browsers without popover support
                if (!this.container.isConnected) {
                    document.body.appendChild(this.container);
                }
            }
        }
    }

    show(options: ToastOptions): void {
        this.ensureContainer();

        const toast = this.createToast(options);
        this.container!.appendChild(toast);
        this.toasts.add(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto dismiss
        const duration = options.duration || 3000;
        setTimeout(() => this.dismiss(toast), duration);
    }

    private createToast(options: ToastOptions): HTMLElement {
        const toast = document.createElement('div');
        toast.className = `toast toast-${options.type}`;

        const icon = this.getIcon(options.type);

        toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-message">${options.message}</div>
      </div>
      <button class="toast-close" aria-label="Cerrar">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="toast-progress"></div>
    `;

        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn?.addEventListener('click', () => this.dismiss(toast));

        return toast;
    }

    private getIcon(type: ToastOptions['type']): string {
        const icons = {
            success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
            error: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
            warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
            info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 16V12M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
        };
        return icons[type];
    }

    private dismiss(toast: HTMLElement): void {
        toast.classList.remove('show');
        toast.classList.add('hide');

        setTimeout(() => {
            toast.remove();
            this.toasts.delete(toast);
        }, 300);
    }
}

// Modal Manager Class
class ModalManager {
    private activeModal: HTMLElement | null = null;

    show(options: ConfirmOptions): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = this.createModal(options);
            document.body.appendChild(modal);
            this.activeModal = modal;

            // Trigger animation
            requestAnimationFrame(() => {
                modal.classList.add('show');
            });

            // Event listeners
            const confirmBtn = modal.querySelector('.modal-confirm-btn');
            const cancelBtn = modal.querySelector('.modal-cancel-btn');
            const backdrop = modal.querySelector('.modal-backdrop');

            confirmBtn?.addEventListener('click', () => {
                this.close(modal);
                resolve(true);
            });

            cancelBtn?.addEventListener('click', () => {
                this.close(modal);
                resolve(false);
            });

            backdrop?.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.close(modal);
                    resolve(false);
                }
            });

            // ESC key to close
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    this.close(modal);
                    resolve(false);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }

    showAlert(message: string, type: 'error' | 'success' | 'info' = 'info'): Promise<void> {
        return new Promise((resolve) => {
            const modal = this.createAlertModal(message, type);
            document.body.appendChild(modal);
            this.activeModal = modal;

            requestAnimationFrame(() => {
                modal.classList.add('show');
            });

            const okBtn = modal.querySelector('.modal-ok-btn');
            const backdrop = modal.querySelector('.modal-backdrop');

            okBtn?.addEventListener('click', () => {
                this.close(modal);
                resolve();
            });

            backdrop?.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.close(modal);
                    resolve();
                }
            });
        });
    }

    private createModal(options: ConfirmOptions): HTMLElement {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';

        const typeClass = options.type || 'warning';
        const confirmText = options.confirmText || 'Continuar';
        const cancelText = options.cancelText || 'Cancelar';

        modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content modal-${typeClass}">
        <div class="modal-header">
          <h3 class="modal-title">${options.title}</h3>
        </div>
        <div class="modal-body">
          <p>${options.message}</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-cancel-btn">${cancelText}</button>
          <button class="modal-btn modal-confirm-btn modal-btn-${typeClass}">${confirmText}</button>
        </div>
      </div>
    `;

        return modal;
    }

    private createAlertModal(message: string, type: string): HTMLElement {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';

        modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content modal-${type}">
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-ok-btn modal-btn-primary">Aceptar</button>
        </div>
      </div>
    `;

        return modal;
    }

    private close(modal: HTMLElement): void {
        modal.classList.remove('show');
        modal.classList.add('hide');

        setTimeout(() => {
            modal.remove();
            this.activeModal = null;
        }, 300);
    }
}

// Singleton instances
const toastManager = new ToastManager();
const modalManager = new ModalManager();

// Public API
export function showToast(options: ToastOptions): void {
    toastManager.show(options);
}

export function showConfirm(options: ConfirmOptions): Promise<boolean> {
    return modalManager.show(options);
}

export function showAlert(message: string, type: 'error' | 'success' | 'info' = 'info'): Promise<void> {
    return modalManager.showAlert(message, type);
}

// Convenience functions
export function showSuccess(message: string): void {
    showToast({ message, type: 'success' });
}

export function showError(message: string): void {
    showToast({ message, type: 'error' });
}

export function showWarning(message: string): void {
    showToast({ message, type: 'warning' });
}

export function showInfo(message: string): void {
    showToast({ message, type: 'info' });
}
