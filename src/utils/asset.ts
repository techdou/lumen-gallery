/**
 * asset.ts — 素材路径工具。
 * exhibits.json 中的路径以 "/" 开头（如 /assets/artworks/x.jpg）；
 * 为兼容子路径部署（vite base './'），统一转为相对路径。
 */
export function assetUrl(p?: string): string {
  if (!p) return '';
  return p.startsWith('/') ? p.slice(1) : p;
}
