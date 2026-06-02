export default function Video({ src }: { src: string }) {
  return (
    <video
      src={src}
      loop
      controls
      autoPlay
      playsInline
      style={{ width: '100%', height: 'auto', borderRadius: 6 }}
    />
  );
}
