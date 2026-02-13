import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { headers } from "next/headers";

export async function vybeRequestInterceptor(config: InternalAxiosRequestConfig) {
  const axiosHeaders = AxiosHeaders.from(config.headers);
  const serverSecret = process.env.VYBE_SERVER_SECRET;
  if (serverSecret) {
    axiosHeaders.set("VYBE_SERVER_SECRET", serverSecret);
  }
  try {
    const incomingHeaders = await headers();
    const vut = incomingHeaders.get("x-vybe-user-token");
    if (vut) {
      axiosHeaders.set("x-vybe-user-token", vut);
    }
  } catch (error) {
    console.warn("Unexpected error reading request headers for VUT forwarding:", error);
  }
  config.headers = axiosHeaders;
  return config;
}
