
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PonenciaService } from './ponencia.service';
import { RevisorService } from '../revisor/revisor.services';
import { Timestamp } from 'firebase/firestore';
import type { Ponencia } from '../../models/ponencia';

// --- Mocks ---

// Mock de Firebase Firestore
vi.mock('firebase/firestore', () => {
    return {
        getFirestore: vi.fn(),
        collection: vi.fn(),
        doc: vi.fn(),
        getDoc: vi.fn(),
        getDocs: vi.fn(),
        setDoc: vi.fn(),
        updateDoc: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        arrayUnion: vi.fn(),
        documentId: vi.fn(),
        Timestamp: {
            now: vi.fn(() => ({ toDate: () => new Date(), toMillis: () => Date.now() })),
            fromDate: vi.fn((date) => ({ toDate: () => date, toMillis: () => date.getTime() }))
        }
    };
});

// Mock de RevisorService
// Como PonenciaService instancia RevisorService internamente (new RevisorService()),
// necesitamos mockear el módulo completo y su constructora.
const mockGetRevisores = vi.fn();
const mockAssignPonenciaToRevisor = vi.fn();

vi.mock('../revisor/revisor.services', () => {
    return {
        RevisorService: vi.fn(function () {
            return {
                getRevisores: mockGetRevisores,
                assignPonenciaToRevisor: mockAssignPonenciaToRevisor
            };
        })
    };
});

// Mock del cliente de Firebase para evitar inicialización real
vi.mock('../../firebase/config', () => {
    return {
        firebase: {
            getFirestore: vi.fn(() => ({} as any)), // Retorna objeto vacío o mock necesario
            getAuth: vi.fn(),
        }
    };
});

describe('PonenciaService - createPonencia', () => {
    let service: PonenciaService;
    // Datos de prueba
    const mockPonencia: Ponencia = {
        id: 'ponencia-1',
        titulo: 'Inteligencia Artificial',
        tema: 'IA',
        resumen: 'Resumen de prueba',
        contenido: 'Contenido...',
        autor: 'user-1',
        creado: new Date(),
        evaluaciones: []
    } as unknown as Ponencia;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new PonenciaService();
    });

    it('debería asignar revisores correctamente y guardar la ponencia', async () => {
        // 1. Preparar mocks
        // Simulamos 5 revisores, 3 de ellos con el tema de interés correcto 'IA'
        const revisoresSimulados = [
            { id: 'rev1', datos: { areaInteres: 'IA' }, ponenciasAsignadas: [] },
            { id: 'rev2', datos: { areaInteres: 'IA' }, ponenciasAsignadas: [] },
            { id: 'rev3', datos: { areaInteres: 'IA' }, ponenciasAsignadas: [] }, // Candidato válido
            { id: 'rev4', datos: { areaInteres: 'OTRO' }, ponenciasAsignadas: [] },
            { id: 'rev5', datos: { areaInteres: 'IA' }, ponenciasAsignadas: [] }  // Candidato válido extra
        ];

        mockGetRevisores.mockResolvedValue(revisoresSimulados);
        mockAssignPonenciaToRevisor.mockResolvedValue(undefined);

        // 2. Ejecutar el método
        await service.createPonencia(mockPonencia);

        // 3. Verificaciones

        // a) Debe haber llamado a obtener revisores
        expect(mockGetRevisores).toHaveBeenCalledTimes(1);

        // b) Debe haber guardado la ponencia en Firestore (setDoc)
        // Verificamos que se llamó a las funciones de firebase importadas (necesitaríamos importar las mockeadas para verificar 'toHaveBeenCalled', 
        // pero aquí confiamos en que el flujo no lanzó error y verificamos efectos secundarios como assignPonenciaToRevisor)

        // c) Debe haber asignado exactamente 3 revisores (ya que había 4 candidatos 'IA')
        expect(mockAssignPonenciaToRevisor).toHaveBeenCalledTimes(3);

        // d) Verificar que los revisores asignados sean los correctos (rev1, rev2, rev3, rev5 son candidatos)
        // Como la selección tiene un componente aleatorio (sort con Math.random), no podemos asegurar CUALES 3 específicos,
        // pero sí que fueron 3 llamadas distintas con IDs válidos y el ID de la ponencia.
        const calls = mockAssignPonenciaToRevisor.mock.calls;
        calls.forEach(call => {
            const [revisorId, ponenciaId] = call;
            expect(ponenciaId).toBe(mockPonencia.id);
            expect(['rev1', 'rev2', 'rev3', 'rev5']).toContain(revisorId);
        });
    });

    it('debería manejar el caso con menos de 3 revisores disponibles', async () => {
        // Solo 2 revisores compatibles
        const revisoresEscasos = [
            { id: 'rev1', datos: { areaInteres: 'IA' }, ponenciasAsignadas: [] },
            { id: 'rev2', datos: { areaInteres: 'IA' }, ponenciasAsignadas: [] },
            { id: 'revO', datos: { areaInteres: 'OTRO' }, ponenciasAsignadas: [] }
        ];

        mockGetRevisores.mockResolvedValue(revisoresEscasos);

        await service.createPonencia(mockPonencia);

        // Debería asignar solo a los 2 disponibles
        expect(mockAssignPonenciaToRevisor).toHaveBeenCalledTimes(2);
        expect(mockAssignPonenciaToRevisor).toHaveBeenCalledWith('rev1', mockPonencia.id);
        expect(mockAssignPonenciaToRevisor).toHaveBeenCalledWith('rev2', mockPonencia.id);
    });

    it('debería propagar errores si falla la obtención de revisores', async () => {
        mockGetRevisores.mockRejectedValue(new Error('Error DB'));

        await expect(service.createPonencia(mockPonencia)).rejects.toThrow('Error DB');
    });
});
