'use client';

import dynamic from 'next/dynamic';

export type AsciinemaProps = {
  src: string;
  cols?: number;
  rows?: number;
  poster?: string;
  theme?: string;
};

// asciinema-player reads `window` when it loads, so it can only run in the
// browser. Load the imperative player with ssr:false so it is never imported
// during the static build.
const AsciinemaClient = dynamic(() => import('./AsciinemaClient'), {
  ssr: false,
});

export default function Asciinema(props: AsciinemaProps) {
  return <AsciinemaClient {...props} />;
}
