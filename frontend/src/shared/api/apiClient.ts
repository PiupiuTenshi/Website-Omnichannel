export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export function getImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
  // If path doesn't start with /, add it
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
export class ApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export async function requestJson<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new ApiError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.", 0);
  }
  const payload = await readPayload(response);

  if (!response.ok) {
    throw new ApiError(readErrorMessage(payload), response.status);
  }

  return payload as TResponse;
}

async function readPayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? response.json() : response.text();
}

function readErrorMessage(payload: unknown): string {
  if (typeof payload === "object" && payload !== null) {
    if ("errors" in payload && typeof payload.errors === "object" && payload.errors !== null) {
      const errors = payload.errors as Record<string, string[]>;
      const firstErrorList = Object.values(errors).find(list => Array.isArray(list) && list.length > 0);
      if (firstErrorList) {
        return firstErrorList[0];
      }
    }
    if ("detail" in payload && typeof payload.detail === "string" && payload.detail.length > 0) {
      return payload.detail;
    }
    if ("message" in payload) {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === "string" && message.length > 0) {
        return message;
      }
    }
    if ("title" in payload && typeof payload.title === "string" && payload.title.length > 0) {
      return payload.title;
    }
  }

  return "The request could not be completed. Please try again.";
}
