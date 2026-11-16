// Standard APNs alert delivery. Never logs device tokens or the signing key.

const APNS_HOSTS = {
  production: "https://api.push.apple.com",
  sandbox: "https://api.sandbox.push.apple.com",
} as const;

export type ApnsEnvironment = keyof typeof APNS_HOSTS;

export type ApnsOutcome =
  | { kind: "sent"; apnsId: string }
  | { kind: "invalid_token"; code: string }
  | { kind: "failed"; code: string; retryable: boolean };

let cachedJwt: { token: string; issuedAt: number } | null = null;

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlEncodeText(text: string): string {
  return base64UrlEncode(new TextEncoder().encode(text));
}

function pemToDer(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN [^-]+-----/, "").replace(/-----END [^-]+-----/, "").replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function providerToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && now - cachedJwt.issuedAt < 40 * 60) return cachedJwt.token;

  const keyId = Deno.env.get("APNS_KEY_ID")!;
  const teamId = Deno.env.get("APNS_TEAM_ID")!;
  const privateKey = Deno.env.get("APNS_PRIVATE_KEY")!.replace(/\\n/g, "\n");

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(privateKey),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const header = base64UrlEncodeText(JSON.stringify({ alg: "ES256", kid: keyId }));
  const claims = base64UrlEncodeText(JSON.stringify({ iss: teamId, iat: now }));
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  );
  const token = `${header}.${claims}.${base64UrlEncode(new Uint8Array(signature))}`;
  cachedJwt = { token, issuedAt: now };
  return token;
}

export async function sendApnsAlert(
  environment: ApnsEnvironment,
  deviceToken: string,
  apnsId: string,
  payload: Record<string, unknown>,
): Promise<ApnsOutcome> {
  const topic = Deno.env.get("APNS_TOPIC")!;
  const url = `${APNS_HOSTS[environment]}/3/device/${deviceToken}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `bearer ${await providerToken()}`,
        "apns-topic": topic,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "apns-expiration": "0",
        "apns-id": apnsId,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return { kind: "failed", code: "network_error", retryable: true };
  }

  if (response.status === 200) return { kind: "sent", apnsId };

  let reason = "";
  try {
    const body = await response.json();
    reason = typeof body?.reason === "string" ? body.reason : "";
  } catch {
    reason = "";
  }

  if (response.status === 410 || reason === "BadDeviceToken" || reason === "Unregistered") {
    return { kind: "invalid_token", code: reason || "Unregistered" };
  }
  if (reason === "ExpiredProviderToken" || reason === "InvalidProviderToken") cachedJwt = null;
  const code = reason || `http_${response.status}`;
  const retryable = response.status === 429 || response.status >= 500;
  return { kind: "failed", code, retryable };
}
