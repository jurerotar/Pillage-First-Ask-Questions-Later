import { hashLocalizationFiles } from '@pillage-first/i18n-hashing';
import i18nextCliConfig from '../i18next.config.ts';

await hashLocalizationFiles(i18nextCliConfig);
