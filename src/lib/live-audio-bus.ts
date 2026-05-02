// Shared audio bus so DJMixer output can be merged into the live broadcaster MediaStream.
// Pattern: a single AudioContext + MediaStreamDestination that DJMixer feeds into,
// and useBroadcaster pulls the resulting audio track from when going live.

let ctx: AudioContext | null = null;
let busDest: MediaStreamAudioDestinationNode | null = null;
let busGain: GainNode | null = null;

export function getLiveAudioContext(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function getLiveBusDestination(): MediaStreamAudioDestinationNode {
  const c = getLiveAudioContext();
  if (!busDest) {
    busDest = c.createMediaStreamDestination();
    busGain = c.createGain();
    busGain.gain.value = 1;
    busGain.connect(busDest);
  }
  return busDest;
}

// Connect a node so its audio is sent to BOTH the local speakers and the live stream bus.
export function tapToLiveBus(node: AudioNode) {
  const c = getLiveAudioContext();
  const dest = getLiveBusDestination();
  // Use a tap gain to avoid duplicate connections messing with the source chain.
  const tap = c.createGain();
  tap.gain.value = 1;
  node.connect(tap);
  tap.connect(busGain || dest);
  return tap;
}

export function getLiveBusStream(): MediaStream | null {
  if (!busDest) return null;
  return busDest.stream;
}
