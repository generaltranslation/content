'use client';

import { useEffect, useRef } from 'react';

import * as AsciinemaPlayer from 'asciinema-player';
import 'asciinema-player/dist/bundle/asciinema-player.css';

import type { AsciinemaProps } from './Asciinema';

// Inner client-only player. Asciinema.tsx loads this with next/dynamic
// (ssr:false), so the asciinema-player import runs only in the browser.
export default function AsciinemaClient({
  src,
  cols,
  rows,
  poster = 'npt:0:01',
  theme = 'asciinema',
}: AsciinemaProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const player = AsciinemaPlayer.create(src, ref.current, {
      cols,
      rows,
      poster,
      theme,
    });

    return () => {
      player.dispose();
    };
  }, [src, cols, rows, poster, theme]);

  return (
    <div ref={ref} className='h-auto w-full overflow-hidden rounded-md' />
  );
}
