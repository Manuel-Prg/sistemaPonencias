import { BaseService } from '../base.service';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    updateDoc,
    documentId,
    Timestamp,
    type DocumentSnapshot
} from 'firebase/firestore';
import type { Ponencia, Evaluacion } from '../../models/ponencia';
import type { Revisor } from '../../models/revisor';

export class RevisorService extends BaseService<Ponencia> {
    protected collectionName = 'ponencias';

    protected convertData(docSnap: DocumentSnapshot): Ponencia {
        const data = docSnap.data();
        if (!data) return {} as Ponencia;

        const creado = data.creado instanceof Timestamp
            ? data.creado.toDate()
            : data.creado;

        const evaluaciones = data.evaluaciones?.map((evaluation: any) => ({
            ...evaluation,
            fecha: evaluation.fecha instanceof Timestamp
                ? evaluation.fecha.toDate()
                : evaluation.fecha
        })) || [];

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

    async getRevisores(): Promise<Revisor[]> {
        try {
            const q = query(
                collection(this.db, 'users'),
                where('rol', '==', 'revisor')
            );
            const revisoresSnapshot = await getDocs(q);

            return revisoresSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    datos: data.datos,
                    ponenciasAsignadas: data.ponenciasAsignadas,
                    id: doc.id
                } as Revisor;
            });
        } catch (error) {
            console.error('Error obteniendo revisores:', error);
            throw error;
        }
    }

    async getPresentations(presentationIds: string[]): Promise<Ponencia[]> {
        if (!presentationIds.length) return [];
        return this.getAll([where(documentId(), 'in', presentationIds)]);
    }

    async saveEvaluation(
        presentationId: string,
        reviewerId: string,
        evaluation: Partial<Evaluacion>
    ): Promise<void> {
        try {
            const presentationRef = doc(this.db, this.collectionName, presentationId);
            const presentationDoc = await getDoc(presentationRef);

            if (!presentationDoc.exists()) {
                throw new Error('La ponencia no existe');
            }

            const data = presentationDoc.data();
            const evaluaciones = data.evaluaciones || [];
            const evaluacionIndex = evaluaciones.findIndex(
                (evaluation: Evaluacion) => evaluation.revisor === reviewerId
            );

            const nuevaEvaluacion: Evaluacion = {
                revisor: reviewerId,
                evaluacion: evaluation.evaluacion!,
                correcciones: evaluation.correcciones,
                fecha: new Date(),
            };

            const updatedEvaluaciones = evaluacionIndex >= 0
                ? evaluaciones.map((evaluation: Evaluacion, index: number) =>
                    index === evaluacionIndex
                        ? {
                            ...nuevaEvaluacion,
                            fecha: Timestamp.fromDate(nuevaEvaluacion.fecha)
                        }
                        : evaluation
                )
                : [...evaluaciones, {
                    ...nuevaEvaluacion,
                    fecha: Timestamp.fromDate(nuevaEvaluacion.fecha)
                }];

            await updateDoc(presentationRef, {
                evaluaciones: updatedEvaluaciones
            });
        } catch (error) {
            this.handleError('saveEvaluation', error);
            throw error;
        }
    }

    async assignPonenciaToRevisor(revisorId: string, ponenciaId: string): Promise<void> {
        try {
            // 1. Obtener datos del revisor
            const revisorRef = doc(this.db, 'users', revisorId);
            const revisorDoc = await getDoc(revisorRef);

            if (!revisorDoc.exists()) {
                throw new Error('El revisor no existe');
            }

            const revisorData = revisorDoc.data();
            const ponenciasAsignadas = revisorData.ponenciasAsignadas || [];

            // 2. Validaciones
            if (ponenciasAsignadas.length >= 2) {
                throw new Error('El revisor ya tiene el máximo de 2 ponencias asignadas');
            }

            if (ponenciasAsignadas.some((p: any) => p.ponencia === ponenciaId)) {
                throw new Error('Esta ponencia ya está asignada a este revisor');
            }

            // 3. Obtener/Validar ponencia
            const ponenciaRef = doc(this.db, this.collectionName, ponenciaId);
            const ponenciaDoc = await getDoc(ponenciaRef);

            if (!ponenciaDoc.exists()) {
                throw new Error('La ponencia no existe');
            }

            // 4. Actualizar usuario (revisor)
            const nuevaAsignacion = {
                ponencia: ponenciaId,
                estado: 'pendiente',
                fechaAsignacion: Timestamp.fromDate(new Date())
            };

            await updateDoc(revisorRef, {
                ponenciasAsignadas: [...ponenciasAsignadas, nuevaAsignacion]
            });

        } catch (error) {
            this.handleError('assignPonenciaToRevisor', error);
            throw error;
        }
    }
}
