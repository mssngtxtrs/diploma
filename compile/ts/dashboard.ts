import { changeHeaderColorOnScroll, changeHeaderAuthButtons, burgerButtonListenerSetup, showLogOutdialog } from "./modules/ui.js";
import { displayMessagesFromServer } from "./modules/messages.js";
import { displayMessage, createElement } from "./modules/utils.js";
import { fetchAPIResponse, fetchAPIBlob } from "./modules/api.js";
import type { APIResponse } from "./modules/api.js";

var REQUESTS: Array<Record<string, any>> = [];
var FILTERED_REQUESTS: Array<Record<string, any>> = [];
var SHOWN_ENTRIES: number = 4;
var TOTAL_PAGES: number = 0;
var CANCEL_DIALOG_OPENED: boolean = false;
var REQUESTS_TOTAL: number = 0;

async function main(): Promise<void> {
  displayMessagesFromServer();
  changeHeaderColorOnScroll();
  changeHeaderAuthButtons();
  burgerButtonListenerSetup();

  fillPersonalInfo();
  listenersSetup();
  await fillFilterOptions();
  await getRequestsWrap();
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

async function fillPersonalInfo(): Promise<void> {
  var dashboard_info = await fetchAPIResponse<Record<string, any>>("/api/auth/credentials")
  if (dashboard_info.status === "success") {
    if (dashboard_info.data) {
      const personal_text_container: HTMLElement | null = document.querySelector("#personal .text");
      if (personal_text_container) {
        const name_container: HTMLHeadingElement | null = personal_text_container.querySelector("h2");
        if (name_container) {
          const second_name: string = dashboard_info.data['second_name'] ? ` ${dashboard_info.data['second_name']}` : "";
          const name_string: string = dashboard_info.data['last_name'] + " " + dashboard_info.data['first_name'] + second_name;
          name_container.classList.remove("skeleton");
          name_container.textContent = name_string;
        } else {
          console.error("Name block not found");
        }

        const email_container: HTMLHeadingElement | null = personal_text_container.querySelector("h3");
        if (email_container) {
          const email_string: string = dashboard_info.data['email']
          email_container.classList.remove("skeleton");
          email_container.textContent = email_string;
        } else {
          console.error("Email block not found");
        }

        const level_container: HTMLParagraphElement | null = personal_text_container.querySelector("p:first-of-type");
        if (level_container) {
          const level_string: string = `Роль: ${dashboard_info.data['level_name']}`;
          level_container.classList.remove("skeleton");
          level_container.textContent = level_string;
        } else {
          console.error("Level container not found");
        }

        REQUESTS_TOTAL = dashboard_info.data['requests_total'];
        fillRequestsTotal();
      }
    }
  } else {
    displayMessage("Ошибка получения данных о пользователе", "error");
    console.error(`Error recieving credentials from server: ${dashboard_info.message ?? 'Unknown error'}`)
  }
}

async function getRequests(state_id: number | null = null): Promise<Array<Record<string, any>> | null> {
  var requests: APIResponse<Array<Record<string, any>>> | null = null;
  if (!state_id) {
    requests = await fetchAPIResponse<Array<Record<string, any>>>("/api/requests");
  } else {
    var payload: Record<string, string> = { 'state_id': state_id.toString() }
    requests = await fetchAPIResponse<Array<Record<string, any>>>("/api/requests", payload);
  }

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

async function fillRequests(requested_page: number = 1): Promise<void> {
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

function createPlaceholderForRequests(): void {
  const container: HTMLElement | null = document.querySelector("#requests");
  if (container) {
    container.replaceChildren();
    const placeholder = createElement<HTMLDivElement>("div", null, ["no_results"]);
    if (placeholder) {
      createElement("h2", "Нет результатов", null, null, placeholder);
      createElement("p", "Попробуйте изменить фильтры или вернуться позже.", null, null, placeholder);
      container.appendChild(placeholder);
    }
  }
}

function fillPagination(): void {
  const container: HTMLElement | null = document.querySelector("#requests_header .pagination");
  if (container) {
    container.replaceChildren();
    for (let i = 1; i <= TOTAL_PAGES; i++) {
      const button = createElement("button", i.toString(), null, { "id": `page_${i}` });
      if (button) {
        button.addEventListener("click", () => {
          if (button.classList.contains("chosen")) {
            return;
          }
          CANCEL_DIALOG_OPENED = false;
          fillRequests(i);
        });
        container.appendChild(button);
      }
    }
  }
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

function createRequestElement(request: Record<string, any>): HTMLElement | null {
  const request_element = createElement("div", null, ["request"], { "id": `request_${request.request_id}` });
  if (request_element) {
    const id_block = createElement("div", null, ["request_block", "id_block"]);
    if (id_block) {
      createElement("h3", `Заявка №${request.request_id}`, null, null, id_block);
      if (request.state_id < 3) {
        const cancel_button = createElement<HTMLParagraphElement>("p", "Отозвать заявку", [ "underlined" ], { "style": `anchor-name: --request-${request.request_id}` });
        if (cancel_button) {
          cancel_button.addEventListener("click", (e) => showCancelDialog(e, request.request_id));
          id_block.appendChild(cancel_button);
        }
      }
      request_element.appendChild(id_block);
    }

    const name_block = createElement("div", null, ["request_block", "name_block"]);
    if (name_block) {
      createElement("p", "Тариф", null, null, name_block);
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

      createElement("p", "Цена: ", null, null, price_block);
      createElement("p", `${request.request_price_final} ₽ за ${request.request_months} ${month_text}`, null, null, price_block);
      request_element.appendChild(price_block);
    }

    const state_block = createElement("div", null, ["request_block", "state_block"]);
    if (state_block) {
      createElement("p", "Статус: ", null, null, state_block);
      const date_string = request.state_id === 2 ? `, время истечения: ${new Date(request.request_expiration_date).toLocaleDateString()}` : "";
      createElement("p", `${request.state_name}${date_string}`, null, null, state_block);
      request_element.appendChild(state_block);
    }

    if (request.state_id === 2) {
      const ssh_block = createElement("div", null, ["request_block", "ssh_block"]);
      if (ssh_block) {
        createElement("p", `Адрес сервера:`, null, null, ssh_block);
        const ip_paragraph = createElement("p", `${request.request_ipv4}`, [ "monospaced", "ip_paragraph", "tooltipped" ], { "style": `anchor-name: --ip-${request.request_id}` });
        if (ip_paragraph) {
          createElement("p", "Нажмите, чтобы скопировать", [ "tooltip" ], { "style": `position-anchor: --ip-${request.request_id}` }, ip_paragraph);
          ip_paragraph.addEventListener("click", () => {
            navigator.clipboard.writeText(`${request.request_ipv4}`).then(() => {
              displayMessage("IP адрес скопирован в буфер обмена");
            });
          });
          ssh_block.appendChild(ip_paragraph);
        }
        createElement("span", null, null, null, ssh_block);
        const ssh_button = createElement("p");
        if (ssh_button) {
          if (request.request_ssh_key_name !== null) {
            ssh_button.textContent = "Получить SSH ключ";
            ssh_button.classList.add("underlined");
            ssh_button.addEventListener("click", () => fetchSSHKeyFromServer(request.request_ssh_key_name));
          } else {
            ssh_button.textContent = "Ключ SSH не присвоен, свяжитесь с администратором";
          }
          ssh_block.appendChild(ssh_button);
        }
        request_element.appendChild(ssh_block);
      }
    }

    if (request.request_note !== null) {
      const note_block = createElement("div", null, ["request_block", "note_block"]);
      if (note_block) {
        createElement("p", "Заметка", null, null, note_block);
        createElement("p", request.request_note, null, null, note_block);
        request_element.appendChild(note_block);
      }
    }

    return request_element;
  }
  return null;
}

function showCancelDialog(e: MouseEvent, request_id: number): void {
  const button: HTMLButtonElement = e.currentTarget as HTMLButtonElement;

  if (button.classList.contains("opened")) {
    button.classList.remove("opened");
    const created_dialog = document.querySelector(".cancel_dialog");
    if (created_dialog) {
      created_dialog.remove();
      CANCEL_DIALOG_OPENED = false;
    }
    return;
  }

  if (CANCEL_DIALOG_OPENED) {
    return;
  }

  button.classList.add("opened");

  const cancel_dialog = createElement("div", null, ["dialog", "cancel_dialog"], { "style": `position-anchor: --request-${request_id}` });
  if (cancel_dialog) {
    createElement("p", "Отозвать заявку? Данное действие не может быть отменено", null, null, cancel_dialog);
    const button_div = createElement("div");
    if (button_div) {
      const revoke_button = createElement("button", "Отозвать", ["destructive"]);
      if (revoke_button) {
        revoke_button.addEventListener("click", async () => {
          const payload = { "request_id": request_id.toString() };
          const response = await fetchAPIResponse("/api/request/revoke", payload);
          if (response.status === "success") {
            button.classList.remove("opened");
            cancel_dialog.remove();
            CANCEL_DIALOG_OPENED = false;
            displayMessage("Запрос успешно отозван");
            getRequestsWrap();
            REQUESTS_TOTAL--;
            fillRequestsTotal(true);
          }
        });
        button_div.appendChild(revoke_button);
      }
      const cancel_button = createElement("button", "Отменить");
      if (cancel_button) {
        cancel_button.addEventListener("click", () => {
          button.classList.remove("opened");
          cancel_dialog.remove();
          CANCEL_DIALOG_OPENED = false;
        });
        button_div.appendChild(cancel_button);
      }
      cancel_dialog.appendChild(button_div);
    }

    const request = document.querySelector(`#request_${request_id}`);
    if (request) {
      request.appendChild(cancel_dialog);
    }

    CANCEL_DIALOG_OPENED = true;
  }
}

function fillRequestsTotal(fill_header: boolean = false): void {
  const total_container: HTMLParagraphElement | null = document.querySelector("#personal .text p:last-of-type");
  if (total_container) {
    const total_string: string = `Активных заявок: ${REQUESTS_TOTAL}`;
    total_container.classList.remove("skeleton");
    total_container.textContent = total_string;
  } else {
    console.error("Level container not found");
  }

  if (fill_header) {
    const header_total: HTMLButtonElement | null = document.querySelector("header .auth_buttons button:first-of-type");
    if (header_total) {
      header_total.textContent = `Заявок: ${REQUESTS_TOTAL}`;
    } else {
      console.error("Header total not found");
    }
  }
}

async function fillFilterOptions(): Promise<void> {
  var filter_options = await fetchAPIResponse<Record<string, any>>("/api/requests/filter");
  if (filter_options.status === "success") {
    if (filter_options.data) {
      const filter_options_select: HTMLSelectElement | null = document.querySelector("#filter");
      if (filter_options_select) {
        filter_options_select.classList.remove("skeleton");
        for (const option of Object.entries(filter_options.data)) {
          createElement<HTMLOptionElement>("option", option[1].state_name, null, { value: option[1].state_id }, filter_options_select);
        };
      } else {
        console.error("Request filter select not found");
      }
    }
  } else {
    displayMessage("Ошибка получения данных о фильтрах", "error");
    console.error(`Error recieving filter options from server: ${filter_options.message ?? 'Unknown error'}`)
  }
}

function filterRequests(requested_state: number = 0): void {
  var ignore_filtering: boolean = requested_state === 0;
  FILTERED_REQUESTS = [];
  REQUESTS.forEach((request) => {
    if (request.state_id === 5 && requested_state !== 5) {
      return;
    }
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
  fillRequests();
}

async function fetchSSHKeyFromServer(ssh_key_name: string): Promise<void> {
  const payload = { ssh_key_name: ssh_key_name };
  const response = await fetchAPIBlob<Blob>(`/api/request/ssh`, payload);
  if (response.status === "success" && response.blob) {
    const blob = response.blob;
    if (!blob) return;

    const object_url = URL.createObjectURL(blob);

    const link = createElement<HTMLAnchorElement>("a");
    if (!link) return;

    link.href = object_url;
    link.download = ssh_key_name;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(object_url);
  } else {
    displayMessage(response.message ?? "Неизвестная ошибка, невозможно получить SSH ключ");
  }
}

function listenersSetup(): void {
  const log_out_button: HTMLButtonElement | null = document.querySelector("#personal button:last-of-type");
  if (log_out_button) {
    log_out_button.addEventListener("click", (e) => showLogOutdialog(e));
  }

  const filter_options_select: HTMLSelectElement | null = document.querySelector("#filter");
  if (filter_options_select) {
    filter_options_select.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      const state_id = parseInt(target.value) ? parseInt(target.value) : 0;
      filterRequests(state_id);
    });
  }
}

document.addEventListener("DOMContentLoaded", main);
