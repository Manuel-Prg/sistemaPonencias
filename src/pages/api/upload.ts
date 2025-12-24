import type { APIRoute } from 'astro';
import { FileUploadService } from '../../lib/services/upload/upload.service';
import { PonenciaService } from '../../lib/services/ponencias/ponencia.service';
import { AuthService } from '../../lib/services/auth/auth.service';

export const POST: APIRoute = async ({ request }) => {
    try {
        // Verificar que sea multipart/form-data
        const contentType = request.headers.get('content-type');
        if (!contentType || !contentType.includes('multipart/form-data')) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Content-Type debe ser multipart/form-data'
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Obtener datos del formulario
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const ponenciaId = formData.get('ponenciaId') as string;

        // Validar que se haya enviado un archivo
        if (!file) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'No se ha enviado ningún archivo'
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Validar que se haya enviado el ID de la ponencia
        if (!ponenciaId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'ID de ponencia no proporcionado'
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Verificar autenticación (obtener token del header)
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'No autorizado'
                }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Subir archivo
        const uploadService = new FileUploadService();
        const uploadResult = await uploadService.uploadFile(file, ponenciaId);

        if (!uploadResult.success) {
            return new Response(
                JSON.stringify(uploadResult),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Actualizar la ponencia con la URL del archivo
        const ponenciaService = new PonenciaService();
        const ponencia = await ponenciaService.getPonenciaById(ponenciaId);

        // Si ya había un archivo, eliminarlo
        if (ponencia.archivoUrl) {
            await uploadService.deleteFile(ponencia.archivoUrl);
        }

        // Actualizar ponencia con nueva URL
        await ponenciaService.updatePonencia(ponenciaId, {
            ...ponencia,
            archivoUrl: uploadResult.fileUrl
        });

        return new Response(
            JSON.stringify(uploadResult),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('Error in upload API:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: `Error del servidor: ${(error as Error).message}`
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
