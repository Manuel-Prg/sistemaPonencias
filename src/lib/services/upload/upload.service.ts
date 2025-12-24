import { AuthService } from '../auth/auth.service';

export interface UploadResponse {
    success: boolean;
    message: string;
    fileUrl?: string;
    publicId?: string; // ID público de Cloudinary para eliminar después
}

export class FileUploadService {
    private authService = new AuthService();
    private readonly ALLOWED_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    private readonly ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];
    private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    /**
     * Valida el tipo y tamaño del archivo
     */
    private validateFile(file: File): { valid: boolean; error?: string } {
        // Validar tipo
        if (!this.ALLOWED_TYPES.includes(file.type)) {
            return {
                valid: false,
                error: 'Tipo de archivo no permitido. Solo se aceptan PDF, DOC y DOCX.'
            };
        }

        // Validar extensión
        const extension = this.getFileExtension(file.name);
        if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
            return {
                valid: false,
                error: 'Extensión de archivo no permitida.'
            };
        }

        // Validar tamaño
        if (file.size > this.MAX_FILE_SIZE) {
            return {
                valid: false,
                error: 'El archivo es demasiado grande. Tamaño máximo: 10MB.'
            };
        }

        return { valid: true };
    }

    /**
     * Sube un archivo a Cloudinary
     * @param file - Archivo a subir
     * @param ponenciaId - ID de la ponencia
     * @returns URL de descarga del archivo y public_id
     */
    async uploadFile(file: File, ponenciaId: string): Promise<UploadResponse> {
        try {
            // Validar archivo
            const validation = this.validateFile(file);
            if (!validation.valid) {
                return {
                    success: false,
                    message: validation.error!
                };
            }

            // Verificar autenticación
            const user: any = await new Promise((resolve) => {
                const unsubscribe = this.authService.onAuthStateChanged((user) => {
                    unsubscribe();
                    resolve(user);
                });
            });

            if (!user) {
                return {
                    success: false,
                    message: 'Usuario no autenticado'
                };
            }

            // Preparar FormData para Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET);
            formData.append('folder', `ponencias/${ponenciaId}`);
            formData.append('resource_type', 'auto'); // Detecta automáticamente el tipo

            // Agregar metadata
            const context = `userId=${user.uid}|ponenciaId=${ponenciaId}|uploadDate=${new Date().toISOString()}`;
            formData.append('context', context);

            // Subir a Cloudinary
            const cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
            const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Error al subir a Cloudinary');
            }

            const data = await response.json();

            return {
                success: true,
                message: 'Archivo subido exitosamente',
                fileUrl: data.secure_url,
                publicId: data.public_id
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            return {
                success: false,
                message: `Error al subir el archivo: ${(error as Error).message}`
            };
        }
    }

    /**
     * Elimina un archivo de Cloudinary
     * @param publicId - ID público del archivo en Cloudinary
     */
    async deleteFile(publicId: string): Promise<boolean> {
        try {
            // La eliminación debe hacerse desde el backend por seguridad
            // Por ahora solo retornamos true
            // TODO: Implementar endpoint de eliminación en el backend
            console.log('Delete file:', publicId);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    /**
     * Obtiene la extensión del archivo desde su nombre
     */
    getFileExtension(fileName: string): string {
        return fileName.split('.').pop()?.toLowerCase() || '';
    }

    /**
     * Verifica si un tipo de archivo es válido
     */
    isValidFileType(fileType: string): boolean {
        return this.ALLOWED_TYPES.includes(fileType);
    }
}
