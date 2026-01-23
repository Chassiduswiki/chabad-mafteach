const aiCache = new Map<string, { result: any; timestamp: number }>();

export function getCachedAIResult(key: string, maxAge: number = 3600000) {
  const cached = aiCache.get(key);
  if (cached && Date.now() - cached.timestamp < maxAge) {
    return cached.result;
  }
  return null;
}

export function setCachedAIResult(key: string, result: any) {
  aiCache.set(key, { result, timestamp: Date.now() });
}
