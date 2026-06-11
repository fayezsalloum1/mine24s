export default function MiningBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <iframe
        src="/machines/cloud_mining_background_gif.html"
        title=""
        tabIndex={-1}
        className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 border-0 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gray-900/70" />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 via-gray-900/20 to-gray-900/85" />
    </div>
  );
}
