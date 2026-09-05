function forwardedAddresses(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
}

/**
 * Resolve a rate-limit identity without trusting a caller-supplied forwarding
 * header. TRUST_PROXY_HOPS is an explicit deployment contract: zero means a
 * direct client connection; one means exactly one controlled reverse proxy.
 * Selecting from the right prevents a caller-prepended XFF value from winning.
 */
export function trustedClientAddress(
  peerAddress: string | undefined,
  forwardedFor: string | string[] | undefined,
): string {
  const peer = peerAddress?.trim() || 'unknown';
  const configuredHops = Number.parseInt(process.env.TRUST_PROXY_HOPS ?? '0', 10);
  const trustedHops = Number.isSafeInteger(configuredHops) && configuredHops > 0
    ? configuredHops
    : 0;
  if (trustedHops === 0) return peer;

  const chain = [...forwardedAddresses(forwardedFor), peer];
  const clientIndex = chain.length - trustedHops - 1;
  return clientIndex >= 0 ? chain[clientIndex] : peer;
}
