import { auth, db } from "../../lib/firebase/config"
import { createUserWithEmailAndPassword, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Constants
const CONFIG = {
  redirectDelay: 2000,
  minPasswordLength: 6,
  minNameLength: 2,
  defaultRole: 'ponente',
  redirectPath: '../autenticacion/iniciarSesion'
};

const NOTIFICATION_STYLES = {
  success: {
    background: '#4CAF50',
    duration: 5000
  },
  error: {
    background: '#f44336',
    duration: 5000
  }
};

// Notification Manager Class
class NotificationManager {
  static createStyles() {
    if (!document.getElementById('notification-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'notification-styles';
      styleSheet.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }

  static show({ message, type = 'success', duration = NOTIFICATION_STYLES[type].duration }) {
    this.createStyles();
    
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `notification notification-${type}`;
    
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px',
      borderRadius: '5px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      color: 'white',
      background: NOTIFICATION_STYLES[type].background,
      zIndex: '1000',
      animation: 'slideIn 0.3s ease-out'
    });

    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }
}

// Form Manager Class
class FormManager {
  constructor(formId) {
    this.form = document.getElementById(formId);
    this.submitButton = this.form?.querySelector('[type="submit"]');
  }

  static validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  getFormData() {
    return {
      name: this.form.querySelector('#name').value.trim(),
      email: this.form.querySelector('#email').value.trim(),
      password: this.form.querySelector('#password').value
    };
  }

  validateForm(data) {
    const errors = [];
    
    if (!data.name || data.name.length < CONFIG.minNameLength) {
      errors.push(`Name must be at least ${CONFIG.minNameLength} characters long`);
    }
    
    if (!data.email || !FormManager.validateEmail(data.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!data.password || data.password.length < CONFIG.minPasswordLength) {
      errors.push(`Password must be at least ${CONFIG.minPasswordLength} characters long`);
    }
    
    return errors;
  }

  setLoading(isLoading) {
    if (this.submitButton) {
      this.submitButton.disabled = isLoading;
      this.submitButton.textContent = isLoading ? 'Registering...' : 'Register';
    }
  }
}

// Registration Service Class
class RegistrationService {
  static async registerUser(userData) {
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    await updateProfile(userCredential.user, { 
      displayName: userData.name 
    });

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      nombre: userData.name,
      rol: CONFIG.defaultRole,
      createdAt: new Date()
    });

    return userCredential;
  }

  static handleError(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled',
      'auth/weak-password': 'Password is too weak'
    };

    return errorMessages[error.code] || `Registration failed: ${error.message}`;
  }
}

// Initialize registration form
document.addEventListener('DOMContentLoaded', () => {
  const formManager = new FormManager('registerForm');
  
  formManager.form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = formManager.getFormData();
    const validationErrors = formManager.validateForm(formData);
    
    if (validationErrors.length > 0) {
      NotificationManager.show({
        message: validationErrors.join('\n'),
        type: 'error'
      });
      return;
    }

    formManager.setLoading(true);
    
    try {
      console.log('Registering user in:', 
        window.location.hostname === 'localhost' ? 'development' : 'production'
      );
      
      await RegistrationService.registerUser(formData);
      
      NotificationManager.show({
        message: 'Registration successful! Redirecting...',
        duration: CONFIG.redirectDelay
      });

      setTimeout(() => {
        window.location.href = CONFIG.redirectPath;
      }, CONFIG.redirectDelay);
    } catch (error) {
      console.error('Registration error:', error);
      
      NotificationManager.show({
        message: RegistrationService.handleError(error),
        type: 'error'
      });
    } finally {
      formManager.setLoading(false);
    }
  });
});

export { NotificationManager, FormManager, RegistrationService };