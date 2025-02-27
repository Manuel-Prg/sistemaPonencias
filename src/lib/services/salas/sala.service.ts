import { firebase } from '../../firebase/config';
import type  { Ponencia } from '../../models/ponencia';
import  { EstadoPonencia } from '../../models/ponencia';
import { doc, getDoc, updateDoc, setDoc, onSnapshot, collection, getDocs, query, where } from 'firebase/firestore';
import type { Sala } from '../../models/sala';
import { AuthService } from '../auth/auth.service';
import { PonenciaService } from '../ponencias/ponencia.service';

export class SalaService {
    private db = firebase.getFirestore();
    private ponenciaService = new PonenciaService();

    async getSala(moderadorId: string): Promise<Sala> {
        const docRef = doc(this.db, 'users', moderadorId);
        const docSnap = await getDoc(docRef);
        const idsala = docSnap.data()?.salaAsignada;
        console.log('idsala', idsala);

        if (!idsala) {
            throw new Error('Sala no encontrada');
        }

        const docRefSala = doc(this.db, 'salas', idsala);
        const docSnapSala = await getDoc(docRefSala);
        const sala = docSnapSala.data() as Sala;

        return sala;
    }

    async getPonenciasBySala(ponencias: string[]): Promise<Ponencia[]> {
        const dataponencia = await this.ponenciaService.getPonenciasByIds(ponencias);
        console.log('dataponencia', dataponencia);
        return this.ponenciaService.getPonenciasByIds(ponencias);
    }

    // New method to update ponencia state
    async updatePonenciaState(ponenciaId: string, newState: EstadoPonencia): Promise<void> {
        try {
            const docRef = doc(this.db, 'ponencias', ponenciaId);
            await updateDoc(docRef, {
                estado: newState,
                fechaActualizacion: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error updating ponencia state:', error);
            throw new Error('Error al actualizar el estado de la ponencia');
        }
    }

    // New method to setup realtime updates for a sala
    setupRealtimeUpdates(moderadorId: string, callback: (sala: Sala) => void): () => void {
        const setupSalaListener = async () => {
            try {
                // First get the sala ID from the user document
                const userDocRef = doc(this.db, 'users', moderadorId);
                const userDocSnap = await getDoc(userDocRef);
                const salaId = userDocSnap.data()?.salaAsignada;

                if (!salaId) {
                    throw new Error('Sala no encontrada');
                }

                // Then set up the listener on the sala document
                const salaRef = doc(this.db, 'salas', salaId);
                return onSnapshot(salaRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const salaData = snapshot.data() as Sala;
                        callback(salaData);
                    }
                });
            } catch (error) {
                console.error('Error setting up sala updates:', error);
                return () => {}; // Return empty cleanup function in case of error
            }
        };

        // Start the listener setup process and store the cleanup function
        let unsubscribe: () => void = () => {};
        setupSalaListener().then(cleanupFn => {
            unsubscribe = cleanupFn;
        });

        // Return a function that will clean up the listener when called
        return () => unsubscribe();
    }

    // New method to update sala details
    async updateSala(salaId: string, data: Partial<Sala>): Promise<void> {
        try {
            const docRef = doc(this.db, 'salas', salaId);
            await updateDoc(docRef, {
                ...data,
                fechaActualizacion: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error updating sala:', error);
            throw new Error('Error al actualizar la sala');
        }
    }

    // New method to get sala by ID
    async getSalaById(salaId: string): Promise<Sala> {
        try {
            const docRef = doc(this.db, 'salas', salaId);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                throw new Error('Sala no encontrada');
            }

            return docSnap.data() as Sala;
        } catch (error) {
            console.error('Error getting sala:', error);
            throw new Error('Error al obtener la sala');
        }
    }

    // New method to check if a ponencia is in a sala
    async isPonenciaInSala(salaId: string, ponenciaId: string): Promise<boolean> {
        try {
            const sala = await this.getSalaById(salaId);
            return sala.integrantes?.includes(ponenciaId) ?? false;
        } catch (error) {
            console.error('Error checking ponencia in sala:', error);
            return false;
        }
    }

    // New method to get all ponencias in a sala with their current status
    async getSalaStatus(salaId: string): Promise<{
        total: number,
        pendientes: number,
        aceptadas: number
    }> {
        try {
            const sala = await this.getSalaById(salaId);
            const ponencias = await this.getPonenciasBySala(sala.integrantes || []);
            
            return {
                total: ponencias.length,
                pendientes: ponencias.filter(p => p.estado === EstadoPonencia.PENDIENTE).length,
                aceptadas: ponencias.filter(p => p.estado === EstadoPonencia.ACEPTADA).length
            };
        } catch (error) {
            console.error('Error getting sala status:', error);
            throw new Error('Error al obtener el estado de la sala');
        }
    }
}