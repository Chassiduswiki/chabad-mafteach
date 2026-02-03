export function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';

  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}
