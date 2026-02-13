import axios from "axios";
import { vybeRequestInterceptor } from "./vybe-request-interceptor";

interface RunActionParams<InputType> {
  actionId: string;
  accountId: string;
  input?: InputType;
}
interface RunActionResponse<ResponseType> {
  exports?: unknown;
  os?: unknown;
  ret?: ResponseType;
  stashId?: unknown | undefined;
}

const vybeDomain = process.env.NEXT_PUBLIC_VYBE_INTEGRATIONS_DOMAIN ?? "https://vybe.build";

export const serverIntegrationClient = axios.create({
  baseURL: vybeDomain + "/api/pipedream",
});

serverIntegrationClient.interceptors.request.use(vybeRequestInterceptor);

export async function runIntegrationActionFromServer<InputType, ResponseType>(
  actionParams: RunActionParams<InputType>,
): Promise<RunActionResponse<ResponseType>> {
  const { accountId, ...rest } = actionParams;
  const response = await serverIntegrationClient.post<RunActionResponse<ResponseType>>(
    `/accounts/${accountId}/run-action`,
    rest,
  );
  return response.data;
}
