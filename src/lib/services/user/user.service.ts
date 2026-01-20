import { BaseService } from '../base.service';
import type { User } from '../../models/user';
import { onSnapshot, type DocumentSnapshot } from 'firebase/firestore';

export class UserService extends BaseService<User> {
  protected collectionName = 'users';

  protected convertData(doc: DocumentSnapshot): User {
    return { uid: doc.id, ...doc.data() } as User;
  }

  protected convertQueryData(doc: any): User {
    return { uid: doc.id, ...doc.data() } as User;
  }

  async getUserById(uid: string): Promise<User> {
    console.log('uid', uid);
    const user = await super.getById(uid);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return user;
  }

  async updateUser(uid: string, data: Partial<User>): Promise<void> {
    await super.update(uid, {
      ...data,
      actualizado: new Date().toISOString()
    });
  }

  async checkUserExists(uid: string): Promise<boolean> {
    const docSnap = await super.getById(uid);
    return !!docSnap;
  }

  async createUser(userData: User): Promise<void> {
    console.log('userData', userData);
    await super.create(userData.uid, userData);
    console.log('Usuario creado exitosamente');
  }

  async getUserData(uid: string): Promise<User> {
    return this.getUserById(uid);
  }

  setupRealtimeUpdates(uid: string, callback: (userData: User) => void): () => void {
    const userRef = this.docRef(uid);
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = this.convertData(snapshot);
        callback(userData);
      }
    });
  }
}
