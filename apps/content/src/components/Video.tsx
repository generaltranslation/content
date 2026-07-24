export default function Video({
  src,
  muted = false,
}: {
  src: string;
  // Accepted for MDX parity with the landing renderer, deliberately unused:
  // this app has theming disabled (RootProvider theme.enabled=false), so a
  // dark variant can never become visible here. Rendering only the light
  // source avoids downloading a video that cannot be shown. The landing
  // renderer is the one that does the real light/dark swap.
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
