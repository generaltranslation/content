'use client';

import dynamic from 'next/dynamic';

// The dotLottie player pulls a WASM runtime; load it in the browser only,
// matching the landing renderer's pattern for the same MDX component.
const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((mod) => mod.DotLottieReact),
  { ssr: false }
);

export type LottieProps = {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
};

export default function Lottie({
  src,
  loop = true,
  autoplay = true,
}: LottieProps) {
  return (
    <div className='h-auto w-full overflow-hidden rounded-md'>
      <DotLottieReact
        src={src}
        loop={loop}
        autoplay={autoplay}
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
}
