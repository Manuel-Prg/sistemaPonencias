import type { MiddlewareHandler } from 'astro';

/**
 * Middleware DESHABILITADO temporalmente para desarrollo
 * Permite acceso a todas las rutas sin restricción
 */
export const onRequest: MiddlewareHandler = async (context, next) => {
    // Permitir todas las rutas sin restricción
    return next();
};
