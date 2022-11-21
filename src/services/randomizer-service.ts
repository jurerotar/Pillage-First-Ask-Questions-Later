import { v4 as uuidv4 } from 'uuid';

export class RandomizerService {
  static generateSeed = (length: number = 10): string => {
    return uuidv4().replaceAll('-', '').substring(0, length);
  };
}
