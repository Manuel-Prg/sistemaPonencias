import { getDocs, collection } from 'firebase/firestore';
import type {User, UserData } from '../../lib/models/user';
import { firebase } from '../../lib/firebase/config';


export class Admin {
    private db = firebase.getFirestore();
    async fetchUsers(): Promise<User[]> {
        try{
            const usersSnapshot = await getDocs(collection(this.db, 'users'));
            const users: User[] = usersSnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    uid: doc.id,
                    rol: data.rol ?? 'sin rol',
                    datos: {
                        nombre: data.nombre,
                        institucion: data.institucion,
                    },
                    ponenciasAsignadas: data.ponenciasAsignadas ?? [],
                } as User;
            });

            return users;
        }catch (error: unknown) {
            console.error('Error fetching users:', error);
            // Si deseas manejar errores específicos, puedes hacer un chequeo
            if (
                error &&
                typeof error === 'object' &&
                'code' in error &&
                (error as any).code === 'permission-denied'
            ) {
                // Llama a tu función de logout o realiza otro manejo específico
                // await handleLogout();
            }
            throw error;
        }

    }
}