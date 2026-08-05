import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    githubUrl: 'https://github.com/generaltranslation/gt',
    i18n: false,
    links: [
      {
        text: 'Blog',
        url: '/blog',
        active: 'nested-url',
      },
      {
        text: 'Devlog',
        url: '/devlog',
        active: 'nested-url',
      },
    ],
    nav: {
      title: 'GT content',
      url: '/docs',
    },
    searchToggle: {
      enabled: false,
    },
    themeSwitch: {
      enabled: false,
    },
  };
}
