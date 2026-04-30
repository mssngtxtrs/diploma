type APIResponse<T> = {
  status: "success" | "error";
  data?: T;
  message?: string;
}

export async function fetchAPIResponse<T>(url: string, body?: Record<string, string>): Promise<APIResponse<T>> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body): null
  });
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
