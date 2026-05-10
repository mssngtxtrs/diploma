export type APIResponse<T> = {
  status: "success" | "error";
  data?: T;
  blob?: T;
  message?: string;
}

export async function fetchAPIResponse<T>(url: string, body?: Record<string, string> | FormData, headers?: Record<string, string>): Promise<APIResponse<T>> {
  var response: Response;
  if (body instanceof FormData) {
    response = await fetch(url, {
      method: "POST",
      // headers: { "Content-Type": "multipart/form-data" },
      body: body
    });
  } else {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body): null
    });
  }
  const data = await response.json();

  if (response.ok) {
    if (data.response === false) {
      return { status: "error", message: data.message };
    } else {
      return { status: "success", data: data.response };
    }
  } else {
    return { status: "error", message: data.message ?? "Ошибка при выполнении запроса" };
  }
}

export async function fetchAPIBlob<T>(url: string, body?: Record<string, string>): Promise<APIResponse<T>> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body): null
  });
  if (!response.ok) {
    return { status: "error", message: `Ошибка HTTP: ${response.status}` };
  }

  const contentType = response.headers.get("Content-Type") || "";

  if (contentType.includes("application/json")) {
    const json = await response.json();
    if (json.response === false) {
      return { status: "error", message: json.message ?? "Ошибка при выполнении запроса" };
    }
    return { status: "error", message: "Ожидался файл, получен JSON без сообщения об ошибке" };
  }

  const data = await response.blob();
  return { status: "success", blob: data as T };
}
