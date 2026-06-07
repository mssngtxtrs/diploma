import { changeHeaderColorOnScroll, changeHeaderAuthButtons, burgerButtonListenerSetup, highlightActiveLink } from "./modules/ui.js";
import { displayMessagesFromServer } from "./modules/messages.js";
import { displayMessage, createElement } from "./modules/utils.js";
import { fetchAPIResponse } from "./modules/api.js";
import type { APIResponse } from "./modules/api.js";

var HOSTINGS: Array<Record<string, any>> = [];
var SERVERS: Array<Record<string, any>> = [];
var SHOWN_ENTRIES: number = 6;
var TOTAL_PAGES: number = 0;
var DIALOG_OPENED: boolean = false;
var HOSTINGS_TOTAL: number = 0;

async function main(): Promise<void> {
  displayMessagesFromServer();
  changeHeaderColorOnScroll();
  changeHeaderAuthButtons();
  burgerButtonListenerSetup();
  highlightActiveLink("hostings");

  await getHostingsWrap();
  setupListeners();
}

function setupListeners(): void {
  const new_button = document.querySelector<HTMLButtonElement>("#hostings_header button#new");
  if (!new_button) return;
  new_button.addEventListener("click", (e) => {
    showHostingDialog(e);
  });
}

async function getHostingsWrap(): Promise<void> {
  await getServers().then((servers) => {
    if (servers) {
      SERVERS = servers.sort((a, b) => b.server_id - a.server_id);
    }
  });

  await getHostings().then((hostings) => {
    if (hostings) {
      HOSTINGS = hostings.sort((a, b) => b.hosting_id - a.hosting_id);
      TOTAL_PAGES = Math.ceil(HOSTINGS.length / SHOWN_ENTRIES);
      fillPagination();
      fillHostings();
    } else {
      createPlaceholderForHostings();
    }
  });
}

async function getServers(): Promise<Array<Record<string, any>> | null> {
  var servers: APIResponse<Array<Record<string, any>>> = await fetchAPIResponse("/api/servers");

  if (servers.status === "success") {
    if (servers.data) {
      return servers.data;
    }
  } else {
    displayMessage(servers.message ?? "Ошибка получения данных о серверах", "error");
    console.error("Error fetching servers:", servers.message ?? "Unknown error");
  }
  return null;
}

async function getHostings(): Promise<Array<Record<string, any>> | null> {
  var hostings: APIResponse<Array<Record<string, any>>> = await fetchAPIResponse("/api/hostings");

  if (hostings.status === "success") {
    if (hostings.data) {
      return hostings.data;
    }
  } else {
    displayMessage(hostings.message ?? "Ошибка получения данных о тарифах", "error");
    console.error("Error fetching hostings:", hostings.message ?? "Unknown error");
  }
  return null;
}

function fillPagination(): void {
  const container: HTMLElement | null = document.querySelector("#hostings_header .pagination .pagination_container");
  if (container) {
    container.replaceChildren();
    countPagination();
    for (let i = 1; i <= TOTAL_PAGES; i++) {
      const button = createElement("button", i.toString(), null, { "id": `page_${i}` });
      if (button) {
        button.addEventListener("click", () => {
          if (button.classList.contains("chosen") || DIALOG_OPENED) return;

          fillHostings(i);
          countPagination(i);
        });
        container.appendChild(button);
      }
    }
  }
}

function countPagination(requested_page: number = 1): void {
  const pagination_count = document.querySelector("#hostings_header .pagination .pagination_count");
  if (!pagination_count) return;

  if (pagination_count.classList.contains("skeleton")) pagination_count.classList.remove("skeleton");
  pagination_count.textContent = `${requested_page} / ${TOTAL_PAGES}`;
}

function highlightPaginationButton(requested_page: number): void {
  const container: HTMLElement | null = document.querySelector("#hostings_header .pagination");
  if (!container) return;

  const buttons = container.querySelectorAll("button");
  buttons.forEach((button) => {
    if (button.id === `page_${requested_page}`) {
      button.classList.add("chosen");
    } else {
      button.classList.remove("chosen");
    }
  });
}

function fillHostings(requested_page: number = 1): void {
  var shown_hostings: Array<Record<string, any>> = [];

  if (requested_page <= TOTAL_PAGES) {
    shown_hostings = HOSTINGS.slice((requested_page - 1) * SHOWN_ENTRIES, requested_page * SHOWN_ENTRIES)
    if (shown_hostings.length > 0) {
      const container: HTMLElement | null = document.querySelector("#hostings");
      if (container) {
        container.replaceChildren();
        shown_hostings.forEach((hosting: Record<string, any>) => {
          const hosting_element = createHostingElement(hosting);
          if (!hosting_element) return;

          container.appendChild(hosting_element);
          highlightPaginationButton(requested_page);
        });
      } else {
        console.error("Requests container not found");
      }
    } else {
      createPlaceholderForHostings();
    }
  } else {
    createPlaceholderForHostings();
  }
}

function createHostingElement(hosting: Record<string, any>): HTMLElement | null {
  const hosting_element = createElement("div", null, ["hosting"], { "id": `hosting_${hosting.hosting_id}` });
  if (!hosting_element) return null;

  const name_block = createElement("div", null, ["hosting_block", "name_block"]);
  if (name_block) {
    createElement("p", hosting.hosting_id, ['monospaced'], null, name_block);
    createElement("h3", hosting.hosting_name, null, null, name_block);
    createElement("p", `${hosting.price_per_month}₽/мес.`, ['monospaced'], null, name_block);
    hosting_element.appendChild(name_block);
  }

  const vcpu_block = createElement("div", null, ["hosting_block", "vcpu_block"]);
  if (vcpu_block) {
    createElement("p", `${hosting.hosting_vcpu} x vCPU`, null, null, vcpu_block);
    hosting_element.appendChild(vcpu_block);
  }

  const ram_block = createElement("div", null, ["hosting_block", "ram_block"]);
  if (ram_block) {
    const ram = hosting.hosting_ram < 1048576 ? `${hosting.hosting_ram / 1024} ГБ` : `${hosting.hosting_ram / 1048576} ТБ`;
    createElement("p", `${ram} RAM`, null, null, ram_block);
    hosting_element.appendChild(ram_block);
  }

  const space_block = createElement("div", null, ["hosting_block", "space_block"]);
  if (space_block) {
    const space = hosting.hosting_space < 1048576 ? `${hosting.hosting_space / 1024} ГБ` : `${hosting.hosting_space / 1048576} ТБ`;
    createElement("p", `${space} ROM`, null, null, space_block);
    hosting_element.appendChild(space_block);
  }

  const server_block = createElement("div", null, ["hosting_block", "server_block"]);
  if (server_block) {
    createElement("p", `Сервер: ${hosting.server_name}`, null, null, server_block);
    createElement("p", `CPU: ${hosting.cpu_name}`, null, null, server_block);
    hosting_element.appendChild(server_block);
  }

  const action_block = createElement("div", null, ["server_block", "action_block"]);
  if (action_block) {
    const edit_button = createElement<HTMLButtonElement>("button", "Редактировать", null, { "style": `anchor-name: --edit-${hosting.hosting_id}` });
    if (!edit_button) return null;

    edit_button.addEventListener("click", (e) => {
      showHostingDialog(e, hosting.hosting_id, hosting);
    });

    action_block.appendChild(edit_button);

    const delete_button = createElement<HTMLButtonElement>("button", "Удалить", ['destructive'], { "style": `anchor-name: --delete-${hosting.hosting_id}` });
    if (!delete_button) return null;

    delete_button.addEventListener("click", (e) => {
      showHostingDeleteDialog(e, hosting.hosting_id);
    });

    action_block.appendChild(delete_button);

    hosting_element.appendChild(action_block);
  }

  return hosting_element;
}

function createPlaceholderForHostings(): void {
  const container = document.querySelector("#hostings");
  if (!container) return;

  container.replaceChildren();

  const placeholder = createElement("div", null, ["placeholder"]);
  if (!placeholder) return;

  createElement("h2", "Нет тарифов", null, null, placeholder);
  createElement("p", "Создайте новый или попробуйте вернуться позже", null, null, placeholder);

  container.appendChild(placeholder);
}

function handleDialogClose(button: HTMLButtonElement, dialog: Element | null): void {
  button.classList.remove("opened");
  if (dialog) dialog.remove();
  DIALOG_OPENED = false;
}


async function saveHostingData(payload: Record<string, string>): Promise<boolean> {
  const endpoint = payload.hosting_id ? "/api/admin/hostings/edit" : "/api/admin/hostings/create";
  const response = await fetchAPIResponse(endpoint, payload);
  return response.status === "success";
}

function showHostingDialog(e: MouseEvent, hosting_id: number | null = null, hosting: Record<string, string> | null = null): void {
  const button = e.currentTarget as HTMLButtonElement;

  if (button.classList.contains("opened")) {
    button.classList.remove("opened");
    const existing_dialog = document.querySelector(".dialog");
    if (existing_dialog) existing_dialog.remove();
    DIALOG_OPENED = false;
    return;
  }

  if (DIALOG_OPENED) {
    displayMessage("Завершите редактирование для переключения");
    return;
  }

  const anchor_style = hosting_id ? `position-anchor: --edit-${hosting_id}` : "position-anchor: --new";
  const dialog = createElement("div", null, ["dialog", "hosting_dialog"], { "style": anchor_style });
  if (!dialog) return;

  const form = createElement<HTMLFormElement>("form");
  if (!form) return;

  createElement("h3", hosting_id ? "Редактировать хостинг" : "Создать хостинг", null, null, form);

  // hosting_name
  const name_block = createElement("div", null, ["input"]);
  if (!name_block) return;
  createElement("label", "Название хостинга", null, { "for": "hosting_name" }, name_block);
  const input_name = createElement<HTMLInputElement>("input", null, null, { "id": "hosting_name", "type": "text", "required": "true" });
  if (!input_name) return;

  if (hosting) {
    input_name.value = hosting.hosting_name ?? "";
  }

  name_block.appendChild(input_name);
  form.appendChild(name_block);

  // hosting_ram
  const ram_block = createElement("div", null, ["input"]);
  if (!ram_block) return;
  createElement("label", "Оперативная память (МБ)", null, { "for": "hosting_ram" }, ram_block);
  const input_ram = createElement<HTMLInputElement>("input", null, null, { "id": "hosting_ram", "type": "number", "required": "true" });
  if (!input_ram) return;

  if (hosting) {
    input_ram.value = hosting.hosting_ram ?? "";
  }

  ram_block.appendChild(input_ram);
  form.appendChild(ram_block);

  // hosting_vcpu
  const vcpu_block = createElement("div", null, ["input"]);
  if (!vcpu_block) return;
  createElement("label", "Количество vCPU", null, { "for": "hosting_vcpu" }, vcpu_block);
  const input_vcpu = createElement<HTMLInputElement>("input", null, null, { "id": "hosting_vcpu", "type": "number", "required": "true" });
  if (!input_vcpu) return;

  if (hosting) {
    input_vcpu.value = hosting.hosting_vcpu ?? "";
  }

  vcpu_block.appendChild(input_vcpu);
  form.appendChild(vcpu_block);

  // hosting_traffic
  const traffic_block = createElement("div", null, ["input"]);
  if (!traffic_block) return;
  createElement("label", "Лимит трафика (ГБ)", null, { "for": "hosting_traffic" }, traffic_block);
  const input_traffic = createElement<HTMLInputElement>("input", null, null, { "id": "hosting_traffic", "type": "number", "required": "true" });
  if (!input_traffic) return;

  if (hosting) {
    input_traffic.value = hosting.hosting_traffic ?? "";
  }

  traffic_block.appendChild(input_traffic);
  form.appendChild(traffic_block);

  const price_block = createElement('div', null, ['input']);
  if (!price_block) return;
  createElement("label", "Цена (₽/мес.)", null, { "for": "hosting_price" }, price_block);
  const input_price = createElement<HTMLInputElement>("input", null, null, { "id": "hosting_price", "type": "number", "required": "true" });
  if (!input_price) return;

  if (hosting) {
    input_price.value = hosting.price_per_month ?? "";
  }

  price_block.appendChild(input_price);
  form.appendChild(price_block);

  // Поля только для создания
  if (!hosting_id) {
    const space_block = createElement("div", null, ["input"]);
    if (!space_block) return;
    createElement("label", "Объем диска (МБ)", null, { "for": "hosting_space" }, space_block);
    const input_space = createElement<HTMLInputElement>("input", null, null, { "id": "hosting_space", "type": "number", "required": "true" });
    if (!input_space) return;

    space_block.appendChild(input_space);
    form.appendChild(space_block);

    const server_block = createElement("div", null, ["input"]);
    if (!server_block) return;
    createElement("label", "Сервер", null, { "for": "server_id" }, server_block);
    const select_wrap = createElement<HTMLInputElement>("div", null, ['select_wrap']);
    if (!select_wrap) return;

    const select_server = createElement<HTMLSelectElement>("select", null, null, { "name": "server_id", "id": "server_id", "required": "true" });
    if (!select_server) return;

    if (SERVERS) {
      for (const server of SERVERS) {
        createElement("option", server.server_name, null, { "value": server.server_id }, select_server);
      }
    }

    const selected_server = SERVERS.find(server => server.server_id == select_server.value);
    if (!selected_server) return;

    input_space.max = selected_server.server_space_total;

    select_server.addEventListener("change", (e) => {
      const server_select = e.currentTarget as HTMLSelectElement;
      if (!server_select) return;

      const space_input = form.querySelector<HTMLInputElement>("#hosting_space");
      if (!space_input) return;

      const selected_server = SERVERS.find(server => server.server_id == server_select.value);
      if (!selected_server) return;

      space_input.max = selected_server.server_space_total;
    });

    select_wrap.appendChild(select_server);

    createElement("div", null, ["select_chevron"], null, select_wrap);

    server_block.appendChild(select_wrap);
    form.appendChild(server_block);
  }

  createElement("button", "Сохранить", ["accent"], { "type": "submit" }, form);

  const cancel_button = createElement("button", "Отмена", null, { "type": "button" });
  if (!cancel_button) return;

  cancel_button.addEventListener("click", () => {
    button.classList.remove('opened');
    dialog.remove();
    DIALOG_OPENED = false;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    if (!form) return;

    const input_name = form.querySelector<HTMLInputElement>("#hosting_name");
    const input_ram = form.querySelector<HTMLInputElement>("#hosting_ram");
    const input_vcpu = form.querySelector<HTMLInputElement>("#hosting_vcpu");
    const input_traffic = form.querySelector<HTMLInputElement>("#hosting_traffic");
    const input_price = form.querySelector<HTMLInputElement>("#hosting_price");
    if (!input_name || !input_ram || !input_vcpu || !input_traffic || !input_price) return;

    const payload: Record<string, string> = {
      hosting_name: input_name.value,
      hosting_ram: input_ram.value,
      hosting_vcpu: input_vcpu.value,
      hosting_traffic: input_traffic.value,
      price_per_month: input_price.value
    };

    if (hosting_id) {
      payload.hosting_id = hosting_id.toString();
    } else {
      const input_space = form.querySelector<HTMLInputElement>("#hosting_space");
      const input_server = form.querySelector<HTMLInputElement>("#server_id");
      if (!input_space || !input_server) return;

      payload.hosting_space = input_space.value;
      payload.server_id = input_server.value;
    }

    if (await saveHostingData(payload)) {
      displayMessage("Хостинг успешно сохранен");
      button.classList.remove("opened");
      dialog.remove();
      DIALOG_OPENED = false;
      getHostingsWrap();
    } else {
      displayMessage("Ошибка при сохранении хостинга", "error");
    }
  });

  form.appendChild(cancel_button);
  dialog.appendChild(form);

  const container_id = hosting_id ? `#hosting_${hosting_id}` : "#hostings_header";
  const container = document.querySelector(container_id);
  if (!container) return;

  container.appendChild(dialog);
  button.classList.add("opened");

  DIALOG_OPENED = true;
}

async function deleteHosting(hosting_id: number): Promise<boolean> {
  const payload: Record<string, string> = {
    hosting_id: hosting_id.toString()
  };
  const response = await fetchAPIResponse("/api/admin/hostings/delete", payload);
  return response.status === "success";
}

function showHostingDeleteDialog(e: MouseEvent, hosting_id: number): void {
  const button = e.currentTarget as HTMLButtonElement;

  if (button.classList.contains("opened")) {
    handleDialogClose(button, document.querySelector(".dialog"));
    return;
  }

  if (DIALOG_OPENED) {
    displayMessage("Завершите редактирование для переключения");
    return;
  }

  button.classList.add("opened");

  const dialog = createElement("div", null, ["dialog", "delete_dialog"], { "style": `position-anchor: --delete-${hosting_id}` });
  if (!dialog) return;

  const form = createElement<HTMLFormElement>("form");
  if (!form) return;

  createElement("h3", "Удалить хостинг", null, null, form);

  createElement("p", "Вы уверены, что хотите удалить этот хостинг? После этого он станет недоступен, хотя заявки останутся действующими.", null, null, form);
  createElement("button", "Подтвердить удаление", ["destructive"], { "type": "submit" }, form);

  const cancel_button = createElement("button", "Отмена", null, { "type": "button" });
  if (!cancel_button) return;

  cancel_button.addEventListener("click", () => {
    button.classList.remove('opened');
    dialog.remove();
    DIALOG_OPENED = false;
  });

  form.appendChild(cancel_button);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (await deleteHosting(hosting_id)) {
      displayMessage("Хостинг успешно удален");
      handleDialogClose(button, dialog);
      getHostingsWrap();
    } else {
      displayMessage("Ошибка при удалении хостинга", "error");
    }
  });

  dialog.appendChild(form);

  const hosting_container = document.querySelector(`#hosting_${hosting_id}`);
  if (!hosting_container) return;
  hosting_container.appendChild(dialog);
  DIALOG_OPENED = true;
}

document.addEventListener("DOMContentLoaded", main);
