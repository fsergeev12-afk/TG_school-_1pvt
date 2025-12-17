import { SetMetadata } from '@nestjs/common';

/**
 * Декоратор для определения ролей, которые могут получить доступ к endpoint
 * Использование: @Roles('creator', 'student')
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);


