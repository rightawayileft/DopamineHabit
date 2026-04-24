import { v4 as uuidv4 } from 'uuid';

import type { UUID } from '@/store/types';

export const createUuid = (): UUID => uuidv4();
