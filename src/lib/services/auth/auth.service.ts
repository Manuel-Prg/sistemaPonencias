import { createUserWithEmailAndPassword, signInWithEmailAndPassword, type Unsubscribe } from 'firebase/auth';
import { firebase } from '../../firebase/config';
import type { AuthCredentials, AuthResponse } from '../../models/auth';
import { UserService } from '../user/user.service';
import type { User as FirebaseUser } from 'firebase/auth';
import { UserRole } from '../../models/user';



export class AuthService {
  private auth = firebase.getAuth();
  private userService = new UserService();

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
  
  async register(credentials: AuthCredentials & { nombre: string}): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );
      
// Crear documento de usuario en Firestore
await this.userService.createUser({
  id: userCredential.user.uid,
  uid: userCredential.user.uid,
  nombre:  credentials.nombre,
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

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): Unsubscribe {
    return this.auth.onAuthStateChanged(callback);
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

