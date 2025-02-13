import { createUserWithEmailAndPassword, signInWithEmailAndPassword, type Unsubscribe } from 'firebase/auth';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebase } from '../../firebase/config';
import type { AuthCredentials, AuthResponse } from '../../models/auth';
import { UserService } from '../user/user.service';
import type { User as FirebaseUser } from 'firebase/auth';
import { UserRole } from '../../models/user';

//api para el inicio de sesión con google
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

export class AuthService {
  private auth = firebase.getAuth();
  private userService = new UserService();
  private googleProvider: GoogleAuthProvider;

  constructor() {
    this.setPersistence();
    this.googleProvider = new GoogleAuthProvider();
    this.googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');
  }

  private async setPersistence(): Promise<void> {
    try {
      const { browserLocalPersistence, setPersistence } = await import('firebase/auth');
      await setPersistence(this.auth, browserLocalPersistence);
    } catch (error) {
      console.error('Error setting persistence:', error);
    }
  }

  async login({ email, password }: AuthCredentials): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      const userData = await this.userService.getUserById(userCredential.user.uid);
      const token = await userCredential.user.getIdToken();

      return {
        user: userData,
        token
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async loginWithGoogle(): Promise<AuthResponse> {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!result.user) {
        throw new Error('No se pudo obtener la información del usuario');
      }

      const userData = await this.userService.getUserById(result.user.uid);
      const token = await result.user.getIdToken();

      return {
        user: userData,
        token
      };
    } catch (error: any) {
      const errorMessage = this.handleGoogleAuthError(error);
      throw new Error(errorMessage);
    }
  }

  private handleGoogleAuthError(error: any): string {
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        return 'Se canceló el inicio de sesión con Google';
      case 'auth/account-exists-with-different-credential':
        return 'Ya existe una cuenta asociada a este correo electrónico';
      case 'auth/popup-blocked':
        return 'El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes e intenta de nuevo';
      case 'auth/cancelled-popup-request':
        return 'La operación fue cancelada por una nueva solicitud de inicio de sesión';
      default:
        return `Error en la autenticación con Google: ${error.message}`;
    }
  }

  async register(credentials: AuthCredentials & { nombre: string }): Promise<void> {
    try {
      console.log('credentials', credentials);
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );

      // Crear documento de usuario en Firestore
      await this.userService.createUser({
        uid: userCredential.user.uid,
        datos: {
          nombre: credentials.nombre,
        },
        rol: UserRole.PONENTE, // Role por defecto
        creado: new Date().toISOString(),
        actualizado: new Date().toISOString()
      });

    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
  }

  async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): Unsubscribe {
    return this.auth.onAuthStateChanged(callback);
  }

  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  handleAuthError(error: any): Error {
    switch (error.code) {
      case 'auth/user-not-found':
        return new Error('Usuario no encontrado');
      case 'auth/wrong-password':
        return new Error('Contraseña incorrecta');
      case 'auth/invalid-email':
        return new Error('Correo electrónico inválido');
      case 'auth/user-disabled':
        return new Error('Usuario deshabilitado');
      case 'auth/email-already-in-use':
        return new Error('El correo electrónico ya está en uso');
      default:
        return new Error('Error de autenticación: ' + error.message);
    }
  }
}