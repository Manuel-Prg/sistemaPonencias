import { firebase } from '../../firebase/config';
import type { User } from '../../models/user';
import { doc, getDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';

export class UserService {
  private db = firebase.getFirestore();

  async getUserById(uid: string): Promise<User> {
    console.log('uid', uid);
    const docRef = doc(this.db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Usuario no encontrado');
    }

    return { uid: docSnap.id, ...docSnap.data() } as User;
  }

  async updateUser(uid: string, data: Partial<User>): Promise<void> {
    const docRef = doc(this.db, 'users', uid);
    await updateDoc(docRef, {
      ...data,
      actualizado: new Date().toISOString()
    });
  }

  

  async checkUserExists(uid: string): Promise<boolean> {
    const docRef = doc(this.db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }

  async createUser(userData: User): Promise<void> {
    const docRef = doc(this.db, 'users', userData.uid);
    await setDoc(docRef, userData);
  }

  async getUserData(uid: string): Promise<User> {
    return this.getUserById(uid);
  }

  setupRealtimeUpdates(uid: string, callback: (userData: User) => void): () => void {
    const userRef = doc(this.db, 'users', uid);
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = { uid: snapshot.id, ...snapshot.data() } as User;
        callback(userData);
      }
    });
  }
}