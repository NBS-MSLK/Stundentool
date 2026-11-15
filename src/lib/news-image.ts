export function validNewsImage(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value !== 'string') return false;
  if (value.startsWith('data:')) {
    const match = /^data:image\/(jpeg|png|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match || match[2].length > Math.ceil(2 * 1024 * 1024 / 3) * 4) return false;
    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length > 2 * 1024 * 1024 || bytes.toString('base64') !== match[2]) return false;
    switch (match[1]) {
      case 'jpeg': return bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
      case 'png': return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      case 'gif': return ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString());
      case 'webp': return bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
    }
  }
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}
