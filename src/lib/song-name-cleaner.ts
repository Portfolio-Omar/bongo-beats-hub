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
  out = out.replace(/[_\\-|•·]+/g, ' ');
  out = out.replace(/\s{2,}/g, ' ').trim();
  // Title-case-ish: keep original casing but trim stray punctuation
  out = out.replace(/^[\s\-_,.;:]+|[\s\-_,.;:]+$/g, '');
  return out || raw.trim();
}

// Heuristic artist + title extraction from filename
export function parseArtistAndTitle(fileName: string): { artist: string; title: string } {
  const base = fileName.replace(/\.[^/.]+$/, '');
  const cleaned = cleanSongName(base);
  // Common formats: "Artist - Title", "Title - Artist", "Artist_Title"
  const sepMatch = cleaned.split(/\s[-–|]\s|_/);
  if (sepMatch.length >= 2) {
    const [a, ...rest] = sepMatch;
    return { artist: cleanSongName(a), title: cleanSongName(rest.join(' - ')) };
  }
  return { artist: '', title: cleaned };
}
