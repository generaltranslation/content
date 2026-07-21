export default function Video({
  src,
  muted = false,
}: {
  src: string;
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
