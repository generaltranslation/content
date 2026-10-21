import { match } from '@formatjs/intl-localematcher';

const supported = ['en', 'zh-Hans', 'zh-Hant', 'pt-BR', 'pt-PT'];

export function bestMatch(requested) {
  return match(requested, supported, 'en', { algorithm: 'best fit' });
}
