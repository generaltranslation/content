export default function Video({
  src,
  muted = false,
}: {
  src: string;
  // Unused: MDX parity with the landing renderer; theming is disabled here,
  // so only the light source is ever rendered.
  srcDark?: string;
  muted?: boolean;
}) {
  return (
    <video
      src={src}
      loop
      controls
      autoPlay
      muted={muted}
      playsInline
      style={{ width: '100%', height: 'auto', borderRadius: 6 }}
    />
  );
}
