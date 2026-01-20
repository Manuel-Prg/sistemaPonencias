import { BaseService } from '../base.service';
import type { Sala } from '../../models/sala';
import { UserService } from '../user/user.service';
import {
    collection,
    query,
    where,
    getDocs,
    Timestamp,
    type DocumentSnapshot,
    addDoc
} from 'firebase/firestore';

export class SalaManagementService extends BaseService<Sala> {
    protected collectionName = 'salas';
    private userService = new UserService();

    protected convertData(doc: DocumentSnapshot): Sala {
        return {
            id: doc.id,
            ...doc.data()
        } as Sala;
    }

    protected convertQueryData(doc: any): Sala {
        return this.convertData(doc);
    }

    async createSala(sala: Omit<Sala, 'id'>): Promise<string> {
        try {
            const salaData = {
                ...sala,
                creado: Timestamp.now(),
                actualizado: Timestamp.now()
            };
            const docRef = await addDoc(this.collectionRef, salaData);
            return docRef.id;
        } catch (error) {
            this.handleError('createSala', error);
            throw new Error('Error al crear la sala');
        }
    }

    async getAllSalas(): Promise<(Sala & { id: string })[]> {
        try {
            const salas = await this.getAll();
            return salas as (Sala & { id: string })[];
        } catch (error) {
            this.handleError('getAllSalas', error);
            throw new Error('Error al obtener las salas');
        }
    }

    async getSalaById(salaId: string): Promise<Sala & { id: string }> {
        try {
            const sala = await super.getById(salaId);
            if (!sala) {
                throw new Error('Sala no encontrada');
            }
            return sala as Sala & { id: string };
        } catch (error) {
            this.handleError('getSalaById', error);
            throw error;
        }
    }

    async updateSala(salaId: string, data: Partial<Sala>): Promise<void> {
        try {
            await super.update(salaId, {
                ...data,
                actualizado: Timestamp.now()
            });
        } catch (error) {
            this.handleError('updateSala', error);
            throw new Error('Error al actualizar la sala');
        }
    }

    async deleteSala(salaId: string): Promise<void> {
        try {
            await super.delete(salaId);
        } catch (error) {
            this.handleError('deleteSala', error);
            throw new Error('Error al eliminar la sala');
        }
    }

    async assignModeradorToSala(salaId: string, moderadorId: string): Promise<void> {
        try {
            // Actualizar el usuario con la sala asignada
            await this.userService.updateUser(moderadorId, {
                salaAsignada: salaId
            });

            // Actualizar la sala con el moderador
            await this.updateSala(salaId, {
                moderador: moderadorId
            });
        } catch (error) {
            this.handleError('assignModeradorToSala', error);
            throw new Error('Error al asignar moderador a la sala');
        }
    }

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
            this.handleError('assignPonenciasToSala', error);
            throw new Error('Error al asignar ponencias a la sala');
        }
    }

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
            this.handleError('removePonenciasFromSala', error);
            throw new Error('Error al remover ponencias de la sala');
        }
    }

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
            this.handleError('getAvailableModerators', error);
            throw new Error('Error al obtener moderadores disponibles');
        }
    }

    async getSalasWithoutModerator(): Promise<(Sala & { id: string })[]> {
        try {
            const salas = await this.getAllSalas();
            return salas.filter(sala => !sala.moderador);
        } catch (error) {
            this.handleError('getSalasWithoutModerator', error);
            throw new Error('Error al obtener salas sin moderador');
        }
    }
}

