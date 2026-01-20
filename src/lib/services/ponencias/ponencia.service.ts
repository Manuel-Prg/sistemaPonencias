import { BaseService } from '../base.service';
import type { EstadoPonencia, Ponencia } from '../../models/ponencia';
import { RevisorService } from '../revisor/revisor.services';
import type { Revisor } from '../../models/revisor';
import {
    where,
    Timestamp,
    doc,
    setDoc,
    updateDoc,
    getDoc,
    arrayUnion,
    type DocumentSnapshot
} from 'firebase/firestore';

export class PonenciaService extends BaseService<Ponencia> {
    protected collectionName = 'ponencias';

    protected convertData(docSnap: DocumentSnapshot): Ponencia {
        const data = docSnap.data();
        if (!data) return {} as Ponencia;

        const creado = data.creado instanceof Timestamp
            ? data.creado.toDate()
            : data.creado;

        const evaluaciones = data.evaluaciones ? data.evaluaciones.map((evaluation: any) => ({
            ...evaluation,
            fecha: evaluation.fecha instanceof Timestamp ? evaluation.fecha.toDate() : evaluation.fecha
        })) : [];

        return {
            ...data,
            id: docSnap.id,
            creado,
            evaluaciones
        } as Ponencia;
    }

    protected convertQueryData(doc: any): Ponencia {
        return this.convertData(doc);
    }

    async getPonenciasByIds(ids: string[]): Promise<Ponencia[]> {
        try {
            console.log('IDs consultados:', ids);
            return this.getAll([where('userId', 'in', ids)]);
        } catch (error) {
            this.handleError('getPonenciasByIds', error);
            throw error;
        }
    }

    async getPonencias(): Promise<Ponencia[]> {
        return this.getAll();
    }

    async getPonenciaById(id: string): Promise<Ponencia> {
        const ponencia = await super.getById(id);
        if (!ponencia) {
            throw new Error('Ponencia not found');
        }
        return ponencia;
    }

    private revisorService = new RevisorService();

    async createPonencia(ponencia: Ponencia): Promise<void> {
        try {
            // 1. Obtener y seleccionar revisores
            const allRevisores = await this.revisorService.getRevisores();
            // Filtrar revisores que no hayan alcanzado el límite de 2 (o configurable)
            const candidatos = allRevisores.filter(r => (r.ponenciasAsignadas?.length || 0) < 2);

            if (candidatos.length < 3) {
                console.warn('No hay suficientes revisores disponibles para asignar 3. Se asignarán los disponibles.');
            }

            const revisoresSeleccionados = this.seleccionarRevisores(candidatos, 3);

            // 2. Preparar evaluaciones iniciales
            const evaluacionesIniciales = revisoresSeleccionados.map(revisor => ({
                revisor: revisor.id,
                evaluacion: 'pendiente',
                fecha: Timestamp.now()
            }));

            // 3. Preparar datos de la ponencia (guardar con evaluaciones iniciales)
            const { id, ...ponenciaData } = ponencia;

            const ponenciaToSave = {
                ...ponenciaData,
                creado: ponencia.creado,
                evaluaciones: [
                    ...(ponencia.evaluaciones?.map(evaluation => ({
                        ...evaluation,
                        fecha: Timestamp.fromDate(evaluation.fecha)
                    })) || []),
                    ...evaluacionesIniciales
                ]
            };

            const newDocRef = doc(this.db, this.collectionName, id);
            await setDoc(newDocRef, ponenciaToSave);

            // 4. Actualizar a los revisores asignados
            // Esto actualiza el documento del revisor para que vea la ponencia en su lista
            await Promise.all(revisoresSeleccionados.map(revisor =>
                this.revisorService.assignPonenciaToRevisor(revisor.id, id)
            ));

        } catch (error) {
            this.handleError('createPonencia', error);
            throw error;
        }
    }

    private seleccionarRevisores(candidatos: any[], cantidad: number): any[] {
        const candidatosConMetadata = candidatos.map(r => ({
            revisor: r,
            carga: r.ponenciasAsignadas?.length || 0,
            rand: Math.random()
        }));

        candidatosConMetadata.sort((a, b) => {
            if (a.carga !== b.carga) return a.carga - b.carga;
            return a.rand - b.rand;
        });

        return candidatosConMetadata.slice(0, cantidad).map(x => x.revisor);
    }

    async updatePonencia(id: string, ponencia: Ponencia): Promise<void> {
        try {
            // Remove id from the data to update
            const { id: _, ...updateData } = ponencia;

            // Convert dates to Firestore Timestamps
            const ponenciaToUpdate = {
                ...updateData,
                creado: ponencia.creado,
                evaluaciones: ponencia.evaluaciones?.map(evaluation => ({
                    ...evaluation,
                    fecha: Timestamp.fromDate(evaluation.fecha)
                })) || []
            };

            await super.update(id, ponenciaToUpdate as unknown as Partial<Ponencia>);
        } catch (error) {
            this.handleError('updatePonencia', error);
            throw error;
        }
    }

    async updatePonenciaStatus(
        id: string,
        ponencia: string,
        estado: EstadoPonencia,
        comentarios?: string
    ): Promise<boolean> {
        try {
            const ponenciaRef = doc(this.db, this.collectionName, ponencia);
            const ponenciaDoc = await getDoc(ponenciaRef);

            if (!ponenciaDoc.exists()) {
                throw new Error('Ponencia no encontrada');
            }

            const data = ponenciaDoc.data();
            const evaluaciones = data.evaluaciones || [];
            const evaluacionIndex = evaluaciones.findIndex(
                (evaluation: any) => evaluation.revisor === id
            );

            if (evaluacionIndex >= 0) {
                // Actualizar evaluación existente
                evaluaciones[evaluacionIndex] = {
                    ...evaluaciones[evaluacionIndex],
                    evaluacion: estado,
                    correcciones: comentarios || '',
                    fecha: new Date().toISOString()
                };

                await updateDoc(ponenciaRef, {
                    estado: estado,
                    evaluaciones: evaluaciones,
                    updatedAt: new Date().toISOString()
                });
            } else {
                // Crear nueva evaluación
                await updateDoc(ponenciaRef, {
                    estado: estado,
                    evaluaciones: arrayUnion({
                        revisor: id,
                        evaluacion: estado,
                        correcciones: comentarios || '',
                        fecha: new Date().toISOString()
                    }),
                    updatedAt: new Date().toISOString()
                });
            }

            return true;
        } catch (error) {
            this.handleError('updatePonenciaStatus', error);
            return false;
        }
    }
}
