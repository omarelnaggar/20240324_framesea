import { headers } from "next/headers";

export function currentURL(pathname: string): URL {
  const headersList = headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";

  try {
    return new URL(pathname, `${protocol}://${host}`);
  } catch (error) {
    return new URL(process.env.FRAME_URL as string);
  }
}

export function vercelURL() {
  return process.env.FRAME_URL
    ? process.env.FRAME_URL
    : undefined;
}
