// Cleans noisy/ambiguous tokens from song titles & artist names
// (e.g. "y2mate", "official video", "(Official Audio)", "[HD]", bitrate tags)

const NOISE_PATTERNS: RegExp[] = [
  /\by2\s*mate(?:\.com)?\b/gi,
  /\bmp3\s*(?:juice|download|skull|paw)?\b/gi,
  /\btubidy(?:\.com)?\b/gi,
  /\bmdundo(?:\.com)?\b/gi,
  /\bfakaza(?:\.com)?\b/gi,
  /\bbongo\s*flava\s*dot\s*com\b/gi,
  /\bwww\.[^\s]+/gi,
  /\bhttps?:\/\/\S+/gi,
  /\bofficial\s*(?:music\s*)?(?:video|audio|lyric[s]?|visualizer)\b/gi,
  /\b(?:full\s*)?(?:hd|hq|4k|1080p|720p|480p)\b/gi,
  /\b\d{2,4}\s*kbps\b/gi,
  /\b(?:free|new|latest|hot)\s*(?:download|mp3|song|audio|video)\b/gi,
  /\bdownload\s*mp3\b/gi,
  /\bremaster(?:ed)?\b/gi,
  /\baudio\s*only\b/gi,
  /\blyrics?\s*video\b/gi,
  /\bvevo\b/gi,
  /\bytmp3\b/gi,
];

// Strip bracketed junk like (official video), [hd], { audio }
const BRACKET_PATTERNS: RegExp[] = [
  /\(\s*(?:official|audio|video|lyric[s]?|hd|hq|visualizer|remix|mp3|y2mate|cover|live)[^()]*\)/gi,
  /\[\s*(?:official|audio|video|lyric[s]?|hd|hq|visualizer|remix|mp3|y2mate|cover|live)[^\]]*\]/gi,
  /\{\s*(?:official|audio|video|lyric[s]?|hd|hq|visualizer|remix|mp3|y2mate|cover|live)[^{}]*\}/gi,
];

export function cleanSongName(raw: string): string {
  if (!raw) return raw;
  let out = raw;
  BRACKET_PATTERNS.forEach((re) => { out = out.replace(re, ' '); });
  NOISE_PATTERNS.forEach((re) => { out = out.replace(re, ' '); });
  // Trim leading/trailing separator chars
  out = out.replace(/[-_\\|•·]+/g, ' ');
  out = out.replace(/\s{2,}/g, ' ').trim();
  // Title-case-ish: keep original casing but trim stray punctuation
  out = out.replace(/^[\s\-_,.;:]+|[\s\-_,.;:]+$/g, '');
  return out || raw.trim();
}

/** True when a name consists only of download-site/URL junk (nothing meaningful left after cleaning) */
export function isJunkName(raw: string): boolean {
  if (!raw) return true;
  let out = raw;
  BRACKET_PATTERNS.forEach((re) => { out = out.replace(re, ' '); });
  NOISE_PATTERNS.forEach((re) => { out = out.replace(re, ' '); });
  out = out.replace(/[-_\\|•·]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  return out.length === 0;
}

// Heuristic artist + title extraction from filename.
// Split on separators BEFORE cleaning so "Artist - Title" is preserved.
export function parseArtistAndTitle(fileName: string): { artist: string; title: string } {
  const base = fileName.replace(/\.[^/.]+$/, '');
  const parts = base.split(/\s*[-–|]\s*|_+/).map(p => cleanSongName(p));
  // Drop pure-numeric junk prefixes (e.g. download-site id "1754946973000")
  while (parts.length > 1 && /^\d+$/.test(parts[0])) parts.shift();
  if (parts.length >= 2 && parts[0]) {
    return { artist: parts[0], title: parts.slice(1).filter(Boolean).join(' ') };
  }
  return { artist: '', title: cleanSongName(base) };
}
