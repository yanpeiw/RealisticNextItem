const FALLBACK_VERSION = '14.19.1';

export function itemIconUrl(iconId: string, version: string | undefined): string {
  const resolvedVersion = version && version !== 'unknown' && version !== 'bundled-fallback' ? version : FALLBACK_VERSION;
  return `https://ddragon.leagueoflegends.com/cdn/${resolvedVersion}/img/item/${iconId}`;
}
