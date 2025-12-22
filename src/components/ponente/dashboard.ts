import { AuthService } from '../../lib/services/auth/auth.service';
import type { User } from 'firebase/auth';

// Navigation URLs
const ROUTES = {
  PONENCIA: '/ponente/datosPonencia',
  DATOS: '/ponente/datosPonente',
  LOGIN: '/',
  ESTADO: '/ponente/registroValido',
  EDITAR: '/ponente/datosPonencia',
  COMPROBANTE: '/ponente/registroValido'
};

class NavigationManager {
  private authService: AuthService;
  private currentUser: User | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.authService = new AuthService();
    this.initializeAuthListener();
  }

  private initializeAuthListener(): void {
    this.unsubscribe = this.authService.onAuthStateChanged((user) => {
      this.currentUser = user;
      if (!user) {
        // Si no hay usuario autenticado, redirigir al login
        window.location.href = ROUTES.LOGIN;
      }
    });
  }

  setupCardActions(): void {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        if (!this.currentUser) {
          window.location.href = ROUTES.LOGIN;
          return;
        }

        const action = card.getAttribute('data-action');
        switch (action) {
          case 'revisar':
            window.location.href = ROUTES.ESTADO;
            break;
          case 'editar':
            window.location.href = ROUTES.EDITAR;
            break;
          case 'descargar':
            window.location.href = ROUTES.COMPROBANTE;
            break;
        }
      });
    });
  }

  setupSocialSharing(): void {
    const shareButtons = document.querySelectorAll('.social-icon');
    const eventUrl = window.location.origin + '/evento';
    const shareText = 'Participa en el evento académico más importante de la región';

    shareButtons.forEach(button => {
      button.addEventListener('click', () => {
        const type = button.getAttribute('data-type');
        let shareUrl;

        switch (type) {
          case 'copy':
            navigator.clipboard.writeText(eventUrl)
              .then(() => {
                // Show feedback
                const originalHTML = button.innerHTML;
                button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg>';
                setTimeout(() => {
                  button.innerHTML = originalHTML;
                }, 2000);
              })
              .catch(err => console.error('Error al copiar:', err));
            break;
          case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`;
            window.open(shareUrl, '_blank');
            break;
          case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}`;
            window.open(shareUrl, '_blank');
            break;
          case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`;
            window.open(shareUrl, '_blank');
            break;
        }
      });
    });
  }

  async handleLogout(): Promise<void> {
    try {
      await this.authService.signOut();
      window.location.href = ROUTES.LOGIN;
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
    }
  }

  async handleDatos(): Promise<void> {
    console.log('handleDatos');
    if (this.currentUser) {
      window.location.href = ROUTES.DATOS;
    }
  }

  setupNavigation(): void {
    // Desktop navigation
    document.getElementById('datos-btn')?.addEventListener('click', () => this.handleDatos());

    document.getElementById('logout-btn')?.addEventListener('click', () => this.handleLogout());

    // Mobile navigation
    document.getElementById('logout-btn-mobile')?.addEventListener('click', () => this.handleLogout());
  }

  initialize(): void {
    this.setupCardActions();
    this.setupSocialSharing();
    this.setupNavigation();
  }

  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const navigationManager = new NavigationManager();
  navigationManager.initialize();

  // Cleanup on page unload
  window.addEventListener('unload', () => {
    navigationManager.cleanup();
  });


});

export async function initializeDashboard(): Promise<void> {
  const dashboard = new NavigationManager();
  console.log('initializeDashboard');
  dashboard.initialize();
}