import { onRequest as authMiddleware } from './middleware/auth.middleware';

export const onRequest = authMiddleware;
