'use client';

import { useEffect, useRef, useState } from 'react';

import type { GTReplayerBundle } from 'gt-rrweb/replay';
import type { CSSProperties } from 'react';

type WalkthroughProps = {
  /** URL of a recording exported by gt-rrweb: a bundle object or a raw events array. */
  src: string;
  /** Locale to start playback in. Defaults to the document language. */
  locale?: string;
  /** Show the in-player locale switcher. */
  switchLocales?: boolean;
  /** Playback height for recordings without a capture frame; framed recordings size themselves. */
  height?: CSSProperties['height'];
  /** Accessible label for the player. */
  title?: string;
};

const LOCALES_TAG = 'gt-locales';

function toBundle(parsed: unknown): GTReplayerBundle | null {
  if (Array.isArray(parsed)) {
    return parsed.length >= 2 ? { events: parsed } : null;
  }
  if (parsed && typeof parsed === 'object' && 'events' in parsed) {
    const { events } = parsed as { events?: unknown };
    if (Array.isArray(events) && events.length >= 2) {
      return parsed as GTReplayerBundle;
    }
  }
  return null;
}

// The recorder stores the locale list on the bundle and also splices it into the
// event stream as a custom event, so an events-only export still carries it.
function readLocales(bundle: GTReplayerBundle): readonly string[] {
  if (bundle.locales?.length) return bundle.locales;
  for (const event of bundle.events) {
    if (event.type !== 5) continue;
    const { tag, payload } = event.data as { tag?: string; payload?: unknown };
    if (tag !== LOCALES_TAG || !payload || typeof payload !== 'object') continue;
    const { locales } = payload as { locales?: unknown };
    if (
      Array.isArray(locales) &&
      locales.every((locale) => typeof locale === 'string')
    ) {
      return locales;
    }
  }
  return [];
}

// GTReplayer ignores initialLocale unless it matches a bundle locale exactly, so
// map the page language onto the recorded locales (en-US -> en, or en -> en-US).
function resolveLocale(
  preferred: string | undefined,
  locales: readonly string[]
): string | undefined {
  if (!preferred || locales.length === 0) return undefined;
  const wanted = preferred.toLowerCase();
  const exact = locales.find((locale) => locale.toLowerCase() === wanted);
  if (exact) return exact;
  const language = wanted.split('-')[0];
  return locales.find(
    (locale) => locale.toLowerCase().split('-')[0] === language
  );
}

export default function Walkthrough({
  src,
  locale,
  switchLocales = true,
  height = 480,
  title = 'Product walkthrough',
}: WalkthroughProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bundle, setBundle] = useState<GTReplayerBundle | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBundle(null);

    fetch(src)
      .then((response) => (response.ok ? response.json() : null))
      .then((parsed) => {
        if (!cancelled) setBundle(toBundle(parsed));
      })
      .catch(() => {
        if (!cancelled) setBundle(null);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    const container = containerRef.current;
    if (!bundle || !container) return;

    let cancelled = false;
    let destroy = () => {};

    import('gt-rrweb/replay').then(({ createGTReplayer }) => {
      if (cancelled) return;
      const preferred = locale ?? document.documentElement.lang;
      const handle = createGTReplayer(container, bundle, {
        initialLocale: resolveLocale(preferred, readLocales(bundle)),
        switchLocalesAllowed: switchLocales,
      });
      destroy = () => handle.destroy();
    });

    return () => {
      cancelled = true;
      destroy();
    };
  }, [bundle, locale, switchLocales]);

  // Render nothing until a recording is published at `src`, so a page reads the
  // same with or without its walkthrough.
  if (!bundle) return null;

  return (
    <div
      ref={containerRef}
      role='region'
      aria-label={title}
      className='my-6 overflow-hidden rounded-lg border'
      style={{ width: '100%', height }}
    />
  );
}
