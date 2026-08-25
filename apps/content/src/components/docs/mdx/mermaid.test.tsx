import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Mermaid } from './mermaid';

test('Mermaid renders accessible diagram source', () => {
  const html = renderToStaticMarkup(
    <Mermaid chart={'flowchart LR\\nA[Source] --> B["Rendered <safely>"]'} />
  );

  assert.match(html, /<figure aria-label="Mermaid diagram source">/);
  assert.match(html, /<figcaption/);
  assert.ok(html.includes('flowchart LR\nA[Source] --&gt; B['));
  assert.ok(html.includes('&quot;Rendered &lt;safely&gt;&quot;'));
});
