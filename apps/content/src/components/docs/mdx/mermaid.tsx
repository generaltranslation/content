import React from 'react';

export type MermaidProps = {
  chart: string;
};

const FALLBACK_LABEL = 'Mermaid diagram source';

export function Mermaid({ chart }: MermaidProps) {
  return (
    <figure aria-label={FALLBACK_LABEL}>
      <figcaption className='text-fd-muted-foreground mb-2 text-sm font-medium'>
        {FALLBACK_LABEL}
      </figcaption>
      <pre className='bg-fd-muted overflow-x-auto rounded-md border p-4 text-sm'>
        <code>{chart.replaceAll('\\n', '\n')}</code>
      </pre>
    </figure>
  );
}
