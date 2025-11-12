import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY_CONSTANT = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC_KEY_CONSTANT, true);
