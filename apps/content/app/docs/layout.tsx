import { DocsLayout } from 'fumadocs-ui/layouts/notebook';

import { baseOptions } from '@/layout.shared';
import { source } from '@/source';

import type { GetSidebarTabsOptions } from 'fumadocs-ui/utils/get-sidebar-tabs';
import type { ReactNode } from 'react';

function getSidebarTabs(): GetSidebarTabsOptions {
  return {
    transform: (option) => {
      const icon = typeof option.icon === 'string' ? undefined : option.icon;
      const contentClassName = icon ? 'ml-3' : undefined;

      return {
        ...option,
        icon,
        title: <span className={contentClassName}>{option.title}</span>,
        description: option.description ? (
          <span className={contentClassName}>{option.description}</span>
        ) : undefined,
      };
    },
  };
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree('en-US')}
      sidebar={{
        tabs: getSidebarTabs(),
      }}
      {...baseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
