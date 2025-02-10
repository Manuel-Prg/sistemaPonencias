import { auth, db } from "../../lib/firebase/config";
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Constants
const ROUTES = {
  admin: '/admin/vistaAdmin',
  ponenteNew: '/ponente/datosPonencia',
  ponenteExisting: '/ponente/registroValido',
  revisor: '/revisor/revisor'
};

const NOTIFICATION_SETTINGS = {
  success: {
    backgroundColor: 'var(--neon-purple)',
    boxShadow: '0 0 15px var(--neon-purple), 0 0 30px var(--neon-pink)'
  },
  error: {
    backgroundColor: '#f44336',
    boxShadow: '0 0 15px #f44336'
  }
};

// Notification Class
class NotificationManager {
  static create(message, type) {
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;

    const settings = NOTIFICATION_SETTINGS[type];
    Object.assign(notification.style, {
      position: 'fixed',
      top: '-100px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '20px 30px',
      borderRadius: '10px',
      backgroundColor: settings.backgroundColor,
      color: 'white',
      boxShadow: settings.boxShadow,
      zIndex: '1000',
      transition: 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      fontSize: '16px',
      fontWeight: '500',
      textAlign: 'center',
      minWidth: '300px',
      backdropFilter: 'blur(5px)',
      border: '2px solid rgba(255, 255, 255, 0.2)'
    });

    return notification;
  }

  static show(message, type) {
    const notification = this.create(message, type);
    document.body.appendChild(notification);

    // Show animation
    requestAnimationFrame(() => {
      notification.style.top = '30px';
      notification.style.opacity = '1';
    });

    // Add hover effects
    this.addHoverEffects(notification, type);

    // Auto-hide
    setTimeout(() => this.hide(notification), 3000);
  }

  static hide(notification) {
    notification.style.top = '-100px';
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 600);
  }

  static addHoverEffects(notification, type) {
    const settings = NOTIFICATION_SETTINGS[type];
    const hoverBoxShadow = type === 'success' 
      ? '0 0 25px var(--neon-purple), 0 0 40px var(--neon-pink)'
      : '0 0 25px #f44336';

    notification.addEventListener('mouseenter', () => {
      notification.style.transform = 'translateX(-50%) scale(1.05)';
      notification.style.boxShadow = hoverBoxShadow;
    });

    notification.addEventListener('mouseleave', () => {
      notification.style.transform = 'translateX(-50%) scale(1)';
      notification.style.boxShadow = settings.boxShadow;
    });
  }
}

// Auth Service Class
class AuthService {
  static async checkUserRole(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? userDoc.data().rol : null;
    } catch (error) {
      console.error('Error checking role:', error);
      return null;
    }
  }

  static async checkPonenciaExists(ponenciaId) {
    try {
      const ponenciaDoc = await getDoc(doc(db, 'ponencias', ponenciaId));
      return ponenciaDoc.exists();
    } catch (error) {
      console.error('Error checking ponencia:', error);
      return false;
    }
  }

  static async redirectPonente(userId) {
    const hasExistingPonencia = await this.checkPonenciaExists(userId);
    window.location.href = hasExistingPonencia ? ROUTES.ponenteExisting : ROUTES.ponenteNew;
  }

  static redirectBasedOnRole(rol, userId) {
    const roleRedirects = {
      admin: () => window.location.href = ROUTES.admin,
      ponente: () => this.redirectPonente(userId),
      revisor: () => window.location.href = ROUTES.revisor,
      default: async () => {
        NotificationManager.show('Rol no autorizado', 'error');
        await auth.signOut();
      }
    };

    (roleRedirects[rol] || roleRedirects.default)();
  }

  static async login(email, password) {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const role = await this.checkUserRole(user.uid);

      if (!role) {
        NotificationManager.show('Usuario sin rol asignado', 'error');
        await auth.signOut();
        return false;
      }

      NotificationManager.show('¡Bienvenido! Inicio de sesión exitoso', 'success');
      this.redirectBasedOnRole(role, user.uid);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      NotificationManager.show(`Error de inicio de sesión: ${error.message}`, 'error');
      return false;
    }
  }

  static async logout() {
    try {
      await signOut(auth);
      NotificationManager.show('Has cerrado sesión correctamente', 'success');
      setTimeout(() => window.location.href = ROUTES.home, 1000);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      NotificationManager.show(`Error al cerrar sesión: ${error.message}`, 'error');
      return false;
    }
  }
}

// Event Listeners
if (typeof window !== "undefined" && typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        await AuthService.login(email, password);
      });
    }
  });
}

// Exports
export const { login: iniciarSesion, logout: cerrarSesion } = AuthService;
export const { show: showNotification } = NotificationManager;