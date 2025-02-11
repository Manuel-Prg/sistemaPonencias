import { firebase } from '../../firebase/config';
import type { User } from '../../models/user';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
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
      updatedAt: new Date().toISOString()
    });
  }

  async createUser(userData: User): Promise<void> {
    const docRef = doc(this.db, 'users', userData.uid);
    await setDoc(docRef, userData);
  }
}