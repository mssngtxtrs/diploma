import { changeHeaderColorOnScroll, changeHeaderAuthButtons, burgerButtonListenerSetup, highlightActiveLink } from "./modules/ui.js";
import { displayMessagesFromServer } from "./modules/messages.js";
import { displayMessage, createElement } from "./modules/utils.js";
import { fetchAPIResponse } from "./modules/api.js";
import type { APIResponse } from "./modules/api.js";

var REQUESTS: Array<Record<string, any>> = [];
var FILTERED_REQUESTS: Array<Record<string, any>> = [];
var SHOWN_ENTRIES: number = 4;
var TOTAL_PAGES: number = 0;
var CHANGE_DIALOG_OPENED: boolean = false;
var REQUESTS_TOTAL: number = 0;
var STATES: Array<Record<string, string>> = [];

async function main(): Promise<void> {
  displayMessagesFromServer();
  changeHeaderColorOnScroll();
  changeHeaderAuthButtons();
  burgerButtonListenerSetup();
  highlightActiveLink("requests");

  await getFilterOptions().then(() => fillFilterOptions());
  await getRequestsWrap();
}

function fillFilterOptions(target: HTMLSelectElement | null = null, required_options: Array<number> = [1, 2, 3, 4, 5]): void {
  var filter_options_select: HTMLSelectElement | null;
  if (target) {
    filter_options_select = target;
  } else {
    filter_options_select = document.querySelector("#filter");
  }

  if (filter_options_select) {
    filter_options_select.classList.remove("skeleton");
    for (const state of STATES) {
      if (!state.state_id) continue;

      if (!required_options.includes(parseInt(state.state_id))) continue;

      const name = state.state_name;
      if (!name) continue;

      const value = state.state_id?.toString();
      if (!value) continue;

      createElement<HTMLOptionElement>("option", name, null, { value: value }, filter_options_select);
    }
  } else {
    console.error("Request filter select not found");
  }
}

async function getFilterOptions(): Promise<void> {
  var filter_options = await fetchAPIResponse<Record<string, any>>("/api/requests/filter");
  if (filter_options.status === "success") {
    if (filter_options.data) {
      for (const option of Object.entries(filter_options.data)) {
        STATES.push({ state_id: option[1].state_id, state_name: option[1].state_name });
      };
    }
  } else {
    displayMessage("Ошибка получения данных о фильтрах", "error");
    console.error(`Error recieving filter options from server: ${filter_options.message ?? 'Unknown error'}`)
  }
}

async function getRequestsWrap(): Promise<void> {
  await getRequests().then((requests) => {
    if (requests) {
      REQUESTS = requests;
      TOTAL_PAGES = Math.ceil(REQUESTS.length / SHOWN_ENTRIES);
      fillPagination();
      filterRequests();
    } else {
      createPlaceholderForRequests();
    }
  });
}

async function getRequests(): Promise<Array<Record<string, any>>| null> {
  var requests: APIResponse<Array<Record<string, any>>> | null = null;
  requests = await fetchAPIResponse<Array<Record<string, any>>>("/api/admin/requests");

  if (requests.status === "success") {
    if (requests.data) {
      return requests.data;
    }
  } else {
    displayMessage(requests.message ?? "Ошибка получения данных о запросах", "error");
    console.error('Error fetching requests:', requests.message ?? 'Unknown error')
  }
  return null;
}

function fillRequests(requested_page: number): void {
  var shown_requests: Array<Record<string, any>> = [];

  if (requested_page <= TOTAL_PAGES) {
    shown_requests = FILTERED_REQUESTS.slice((requested_page - 1) * SHOWN_ENTRIES, requested_page * SHOWN_ENTRIES)
    if (shown_requests.length > 0) {
      const container: HTMLElement | null = document.querySelector("#requests");
      if (container) {
        container.replaceChildren();
        shown_requests.forEach((request: Record<string, any>) => {
          const request_element = createRequestElement(request);
          if (request_element) {
            container.appendChild(request_element);
          }
          highlightPaginationButton(requested_page);
        });
      } else {
        console.error("Requests container not found");
      }
    } else {
      createPlaceholderForRequests();
    }
  } else {
    createPlaceholderForRequests();
  }
}

function createRequestElement(request: Record<string, any>): HTMLElement | null {
  const request_element = createElement("div", null, ["request"], { "id": `request_${request.request_id}` });
  if (request_element) {
    const id_block = createElement("div", null, ["request_block", "id_block"]);
    if (id_block) {
      createElement("h3", `Заявка №${request.request_id}`, ["bold"], null, id_block);
      var name_string: string;

      if (!request.first_name || !request.last_name) {
        name_string = "Удалённый пользователь";
      } else {
        const second_name: string = request.second_name ? ` ${request.second_name}` : "";
        name_string = request.last_name + " " + request.first_name + second_name;
      }

      createElement("p", name_string, null, null, id_block);

      if (request.first_name && request.last_name) {
        const change_button = createElement("p", "Изменить статус", ["underlined"], { "style": `anchor-name: --request-${request.request_id}` });
        if (change_button) {
          change_button.addEventListener("click", (e) => showChangeDialog(e, request.request_id));
          id_block.appendChild(change_button);
        }
      }
      request_element.appendChild(id_block);
    }

    const name_block = createElement("div", null, ["request_block", "name_block"]);
    if (name_block) {
      createElement("p", "Тариф: ", ["bold"], null, name_block);
      createElement("p", request.hosting_name, null, null, name_block);
      request_element.appendChild(name_block);
    }

    const price_block = createElement("div", null, ["request_block", "price_block"]);
    if (price_block) {
      var month_text: string;
      switch (request.request_months) {
        case 1:
          month_text = "месяц";
          break;
        case 2:
        case 3:
        case 4:
          month_text = "месяца";
          break;
        default:
          month_text = "месяцев";
          break;
      }

      createElement("p", "Цена: ", ["bold"], null, price_block);
      createElement("p", `${request.request_price_final} ₽ за ${request.request_months} ${month_text}`, null, null, price_block);
      request_element.appendChild(price_block);
    }

    const state_block = createElement("div", null, ["request_block", "state_block"]);
    if (state_block) {
      createElement("p", "Статус: ", ["bold"], null, state_block);
      const state_string = STATES[request.state_id - 1]?.state_name ?? "";
      const date_string = request.state_id === 2 ? `, время истечения: ${new Date(request.request_expiration_date).toLocaleDateString()}` : "";
      const reject_note = request.state_id === 4 ? `, причина: ${request.request_reject_note}` : "";
      createElement("p", `${state_string}${date_string}${reject_note}`, ["state", `state_${request.state_id}`], null, state_block);
      request_element.appendChild(state_block);
    }

    if (request.state_id === 2) {
      const ssh_block = createElement("div", null, ["request_block", "ssh_block"]);
      if (ssh_block) {
        createElement("p", `Адрес сервера:`, ["bold"], null, ssh_block);
        createElement("p", `${request.request_ipv4}`, [ "monospaced", "ip_paragraph" ], null, ssh_block);
        createElement("span", null, null, null, ssh_block);
        if (request.request_ssh_key_name !== null) {
          createElement("p", `SSH ключ присвоен`, null, null, ssh_block);
        } else {
          createElement("p", `SSH ключ не присвоен`, null, null, ssh_block);
        }
        request_element.appendChild(ssh_block);
      }
    }

    if (request.request_note !== null) {
      const note_block = createElement("div", null, ["request_block", "note_block"]);
      if (note_block) {
        createElement("p", "Заметка: ", ["bold"], null, note_block);
        createElement("p", request.request_note, null, null, note_block);
        request_element.appendChild(note_block);
      }
    }

    return request_element;
  }
  return null;
}

function fillPagination(): void {
  const container: HTMLElement | null = document.querySelector("#requests_header .pagination .pagination_container");
  if (container) {
    container.replaceChildren();
    countPagination();
    for (let i = 1; i <= TOTAL_PAGES; i++) {
      const button = createElement("button", i.toString(), null, { "id": `page_${i}` });
      if (button) {
        button.addEventListener("click", () => {
          if (button.classList.contains("chosen") || CHANGE_DIALOG_OPENED) {
            return;
          }
          fillRequests(i);
          countPagination(i);
        });
        container.appendChild(button);
      }
    }
  }
}

function countPagination(requested_page: number = 1): void {
  const pagination_count = document.querySelector("#requests_header .pagination .pagination_count");
  if (!pagination_count) return;

  if (pagination_count.classList.contains("skeleton")) pagination_count.classList.remove("skeleton");
  pagination_count.textContent = `${requested_page} / ${TOTAL_PAGES}`;
}

function highlightPaginationButton(requested_page: number): void {
  const container: HTMLElement | null = document.querySelector("#requests_header .pagination");
  if (container) {
    const buttons = container.querySelectorAll("button");
    buttons.forEach((button) => {
      if (button.id === `page_${requested_page}`) {
        button.classList.add("chosen");
      } else {
        button.classList.remove("chosen");
      }
    });
  }
}

function filterRequests(requested_state: number = 0): void {
  var ignore_filtering: boolean = requested_state === 0;
  FILTERED_REQUESTS = [];
  REQUESTS.forEach((request) => {
    if (!ignore_filtering) {
      if (request.state_id !== requested_state) {
        return;
      }
    }
    FILTERED_REQUESTS.push(request);
  });
  FILTERED_REQUESTS.sort((a, b) => b.request_id - a.request_id);
  TOTAL_PAGES = Math.ceil(FILTERED_REQUESTS.length / SHOWN_ENTRIES);
  fillPagination();
  fillRequests(1);
}

function createPlaceholderForRequests(): void {
  const container: HTMLElement | null = document.querySelector("#requests");
  if (container) {
    container.replaceChildren();
    const placeholder = createElement<HTMLDivElement>("div", null, ["placeholder"]);
    if (placeholder) {
      createElement("h2", "Нет результатов", null, null, placeholder);
      createElement("p", "Попробуйте изменить фильтры или вернуться позже.", null, null, placeholder);
      container.appendChild(placeholder);
    }
  }
}

function showChangeDialog(e: MouseEvent, request_id: number, initial_state_id: number = 2) {
  const button = e.currentTarget as HTMLButtonElement;

  if (button.classList.contains("opened")) {
    button.classList.remove("opened");
    CHANGE_DIALOG_OPENED = false;
    const created_dialog = document.querySelector(".change_dialog");
    if (created_dialog) {
      created_dialog.remove();
    }
    return;
  }

  if (CHANGE_DIALOG_OPENED) {
    displayMessage("Завершите редактирование для переключения");
    return;
  }

  button.classList.add("opened");

  const change_dialog = createElement("div", null, ["dialog", "change_dialog"], { "style": `position-anchor: --request-${request_id}` })
  if (change_dialog) {
    createElement("h3", "Изменить статус", null, null, change_dialog);

    const form = createElement<HTMLFormElement>("form");
    if (form) {
      const state_block = createElement("div", null, ["input"]);
      if (state_block) {
        createElement("label", "Статус", null, { "for": "state_id" }, state_block);
        const state_select_wrap = createElement("div", null, ["select_wrap"]);
        if (state_select_wrap) {
          const state_select = createElement<HTMLSelectElement>("select", null, null, { "id": "state_id", "name": "state_id" });
          if (state_select) {
            fillFilterOptions(state_select, [ 2, 4 ]);
            state_select.addEventListener("change", () => {
              const ssh_file_block = form.querySelector<HTMLDivElement>(".ssh_file_block");
              const ipv4_block = form.querySelector<HTMLDivElement>(".ipv4_block");
              if (!ssh_file_block || !ipv4_block) return;

              const ssh_file_input = ssh_file_block.querySelector<HTMLInputElement>("input");
              const ipv4_input = ipv4_block.querySelector<HTMLInputElement>("input");
              if (!ssh_file_input || !ipv4_input) return;

              if (parseInt(state_select.value) === 2) {
                ssh_file_block.style.display = "flex";
                ssh_file_input.required = true;
                ipv4_block.style.display = "flex";
                ipv4_input.required = true;
              } else {
                ssh_file_block.style.display = "none";
                ssh_file_input.required = false;
                ssh_file_input.value = "";
                ipv4_block.style.display = "none";
                ipv4_input.required = false;
                ipv4_input.value = "";
              }

              const reject_note_block = form.querySelector<HTMLDivElement>(".reject_note_block");
              if (!reject_note_block) return;

              const reject_note_textarea = reject_note_block.querySelector<HTMLTextAreaElement>("textarea");
              if (!reject_note_textarea) return;

              if (parseInt(state_select.value) === 4) {
                reject_note_block.style.display = "flex";
                reject_note_textarea.required = true;
              } else {
                reject_note_block.style.display = "none";
                reject_note_textarea.required = false;
                reject_note_textarea.value = "";
              }
            });
            state_select_wrap.appendChild(state_select);
            createElement("div", null, ["select_chevron"], null, state_select_wrap);
          }
          state_block.appendChild(state_select_wrap);
        }
        form.appendChild(state_block);
      }

      const ssh_file_block = createElement("div", null, ["input", "ssh_file_block"], { "style": "display: none" });
      if (ssh_file_block) {
        createElement("label", "Файл SSH ключа", null, { "for": "ssh_key_file" }, ssh_file_block);
        const ssh_file_input = createElement<HTMLInputElement>("input", null, null, { "id": "ssh_key_file", "name": "ssh_key_file", "type": "file" });
        if (!ssh_file_input) return;
        if (initial_state_id === 2) {
          ssh_file_block.style.display = "flex";
          ssh_file_input.required = true;
        }
        ssh_file_input.addEventListener("input", (e) => {
          const input = e.currentTarget as HTMLInputElement;
          if (!input) return;

          const error_span: Element | null = input.nextElementSibling;
          if (error_span) {
            if (!input.validity.valid) {
              error_span.textContent = input.getAttribute('title') || "Ошибка валидации";
            } else {
              error_span.textContent = "";
            }
          }
        });
        ssh_file_block.appendChild(ssh_file_input);
        createElement("span", null, null, null, ssh_file_block);
        form.appendChild(ssh_file_block);
      }

      const ipv4_block = createElement("div", null, ["input", "ipv4_block"], { "style": "display: none" });
      if (ipv4_block) {
        createElement("label", "IPv4", null, { "for": "ipv4" }, ipv4_block);
        const ipv4_input = createElement<HTMLInputElement>("input", null, null, { "id": "ipv4", "name": "ipv4", "title": "Неверный IP адрес" });
        if (!ipv4_input) return;
        if (initial_state_id === 2) {
          ipv4_block.style.display = "flex";
          ipv4_input.required = true;
        }
        ipv4_input.addEventListener("input", (e) => {
          const input = e.currentTarget as HTMLInputElement;
          if (!input) return;

          if (!validateIPAddress(input.value)) {
            input.setCustomValidity("Неверный IP адрес");
          } else {
            input.setCustomValidity("");
          }

          const error_span: Element | null = input.nextElementSibling;
          if (error_span) {
            if (!input.validity.valid) {
              error_span.textContent = input.getAttribute('title') || "Ошибка валидации";
            } else {
              error_span.textContent = "";
            }
          }
        })
        ipv4_block.appendChild(ipv4_input);
        createElement("span", null, null, null, ipv4_block);
        form.appendChild(ipv4_block);
      }

      const reject_note_block = createElement("div", null, ["input", "reject_note_block"], { "style": "display: none" });
      if (reject_note_block) {
        createElement("label", "Причина отказа", null, { "for": "reject_note" }, reject_note_block);
        const reject_note_textarea = createElement<HTMLTextAreaElement>("textarea", null, null, { "id": "reject_note", "name": "reject_note", "placeholder": "Введите причину...", "rows": "4" });
        if (!reject_note_textarea) return;
        if (initial_state_id === 4) {
          reject_note_block.style.display = "flex";
          reject_note_textarea.required = true;
        }
        reject_note_block.appendChild(reject_note_textarea);
        form.appendChild(reject_note_block);
      }

      createElement("button", "Изменить", ['accent'], { "type": "submit" }, form);

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const form_data = new FormData(form);
        form_data.append("request_id", request_id.toString());
        if (await changeRequestState(form_data)) {
          displayMessage("Изменения успешно применены");
          button.classList.remove("opened");
          change_dialog.remove();
          CHANGE_DIALOG_OPENED = false;
          getRequestsWrap();
        } else {
          displayMessage("Изменения не были применены");
        }
      });

      change_dialog.appendChild(form);
    }

    const request = document.querySelector(`#request_${request_id}`);
    if (request) {
      request.appendChild(change_dialog);
    }

    CHANGE_DIALOG_OPENED = true;
  }
}

function validateIPAddress(ipv4: string) {
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipv4)
}

async function changeRequestState(form_data: FormData): Promise<boolean> {
  const payload: FormData = form_data;
  const response = await fetchAPIResponse("/api/admin/requests/change", payload);
  if (response.status === "success") {
    return true;
  } else {
    return false;
  }
}

document.addEventListener("DOMContentLoaded", main);
