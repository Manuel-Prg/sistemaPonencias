import { firebase } from '../../firebase/config';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp
} from 'firebase/firestore';
import type { Sala } from '../../models/sala';
import { UserService } from '../user/user.service';

export class SalaManagementService {
    private db = firebase.getFirestore();
    private userService = new UserService();
    private readonly COLLECTION = 'salas';

    /**
     * Crea una nueva sala
     */
    async createSala(sala: Omit<Sala, 'id'>): Promise<string> {
        try {
            const salasRef = collection(this.db, this.COLLECTION);
            const newSalaRef = doc(salasRef);

            const salaData = {
                ...sala,
                creado: Timestamp.now(),
                actualizado: Timestamp.now()
            };

            await setDoc(newSalaRef, salaData);
            return newSalaRef.id;
        } catch (error) {
            console.error('Error creating sala:', error);
            throw new Error('Error al crear la sala');
        }
    }

    /**
     * Obtiene todas las salas
     */
    async getAllSalas(): Promise<(Sala & { id: string })[]> {
        try {
            const salasRef = collection(this.db, this.COLLECTION);
            const snapshot = await getDocs(salasRef);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Sala & { id: string }));
        } catch (error) {
            console.error('Error getting salas:', error);
            throw new Error('Error al obtener las salas');
        }
    }

    /**
     * Obtiene una sala por ID
     */
    async getSalaById(salaId: string): Promise<Sala & { id: string }> {
        try {
            const salaRef = doc(this.db, this.COLLECTION, salaId);
            const salaDoc = await getDoc(salaRef);

            if (!salaDoc.exists()) {
                throw new Error('Sala no encontrada');
            }

            return {
                id: salaDoc.id,
                ...salaDoc.data()
            } as Sala & { id: string };
        } catch (error) {
            console.error('Error getting sala:', error);
            throw error;
        }
    }

    /**
     * Actualiza una sala
     */
    async updateSala(salaId: string, data: Partial<Sala>): Promise<void> {
        try {
            const salaRef = doc(this.db, this.COLLECTION, salaId);
            await updateDoc(salaRef, {
                ...data,
                actualizado: Timestamp.now()
            });
        } catch (error) {
            console.error('Error updating sala:', error);
            throw new Error('Error al actualizar la sala');
        }
    }

    /**
     * Elimina una sala
     */
    async deleteSala(salaId: string): Promise<void> {
        try {
            const salaRef = doc(this.db, this.COLLECTION, salaId);
            await deleteDoc(salaRef);
        } catch (error) {
            console.error('Error deleting sala:', error);
            throw new Error('Error al eliminar la sala');
        }
    }

    /**
     * Asigna un moderador a una sala
     */
    async assignModeradorToSala(salaId: string, moderadorId: string): Promise<void> {
        try {
            // Actualizar el usuario con la sala asignada
            await this.userService.updateUser(moderadorId, {
                salaAsignada: salaId
            });

            // Actualizar la sala con el moderador
            const sala = await this.getSalaById(salaId);
            await this.updateSala(salaId, {
                moderador: moderadorId
            });
        } catch (error) {
            console.error('Error assigning moderador:', error);
            throw new Error('Error al asignar moderador a la sala');
        }
    }

    /**
     * Asigna ponencias a una sala
     */
    async assignPonenciasToSala(salaId: string, ponenciaIds: string[]): Promise<void> {
        try {
            const sala = await this.getSalaById(salaId);
            const currentPonencias = sala.integrantes || [];

            // Combinar ponencias existentes con las nuevas (sin duplicados)
            const updatedPonencias = [...new Set([...currentPonencias, ...ponenciaIds])];

            await this.updateSala(salaId, {
                integrantes: updatedPonencias
            });
        } catch (error) {
            console.error('Error assigning ponencias:', error);
            throw new Error('Error al asignar ponencias a la sala');
        }
    }

    /**
     * Remueve ponencias de una sala
     */
    async removePonenciasFromSala(salaId: string, ponenciaIds: string[]): Promise<void> {
        try {
            const sala = await this.getSalaById(salaId);
            const currentPonencias = sala.integrantes || [];

            // Filtrar las ponencias que se quieren remover
            const updatedPonencias = currentPonencias.filter(id => !ponenciaIds.includes(id));

            await this.updateSala(salaId, {
                integrantes: updatedPonencias
            });
        } catch (error) {
            console.error('Error removing ponencias:', error);
            throw new Error('Error al remover ponencias de la sala');
        }
    }

    /**
     * Obtiene todos los moderadores disponibles (sin sala asignada)
     */
    async getAvailableModerators(): Promise<any[]> {
        try {
            const usersRef = collection(this.db, 'users');
            const q = query(
                usersRef,
                where('rol', '==', 'moderador')
            );

            const snapshot = await getDocs(q);
            const moderadores = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filtrar solo los que no tienen sala asignada
            return moderadores.filter((mod: any) => !mod.salaAsignada);
        } catch (error) {
            console.error('Error getting available moderators:', error);
            throw new Error('Error al obtener moderadores disponibles');
        }
    }

    /**
     * Obtiene salas sin moderador asignado
     */
    async getSalasWithoutModerator(): Promise<(Sala & { id: string })[]> {
        try {
            const salas = await this.getAllSalas();
            return salas.filter(sala => !sala.moderador);
        } catch (error) {
            console.error('Error getting salas without moderator:', error);
            throw new Error('Error al obtener salas sin moderador');
        }
    }
}
