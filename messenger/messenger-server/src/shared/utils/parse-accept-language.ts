export function parseAcceptLanguage(header: string = ''): string {
  const match = header.match(/^[a-z]{2}/i);
  return match ? match[0] : 'en';
}
