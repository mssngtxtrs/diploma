import { changeHeaderColorOnScroll, changeHeaderAuthButtons, burgerButtonListenerSetup, highlightActiveLink } from "./modules/ui.js";
import { displayMessagesFromServer } from "./modules/messages.js";
import { displayMessage, createElement } from "./modules/utils.js";
import { fetchAPIResponse } from "./modules/api.js";
import type { APIResponse } from "./modules/api.js";

var SERVERS: Array<Record<string, any>> = [];
var CPUS: Array<Record<string, any>> = [];
var SHOWN_ENTRIES: number = 6;
var TOTAL_PAGES: number = 0;
var DIALOG_OPENED: boolean = false;
var SERVERS_TOTAL: number = 0;

async function main(): Promise<void> {
  displayMessagesFromServer();
  changeHeaderColorOnScroll();
  changeHeaderAuthButtons();
  burgerButtonListenerSetup();
  highlightActiveLink("servers");

  await getServersWrap();
  setupListeners();
}

function setupListeners(): void {
  const new_button = document.querySelector<HTMLButtonElement>("#servers_header #new");
  if (!new_button) return;
  new_button.addEventListener("click", (e) => {
    showServerDialog(e);
  });
}

async function getServersWrap(): Promise<void> {
  await getCPUS().then((cpus) => {
    if (cpus) {
      CPUS = cpus.sort((a, b) => b.cpu_id - a.cpu_id);
    }
  });

  await getServers().then((servers) => {
    if (servers) {
      SERVERS = servers.sort((a, b) => b.server_id - a.server_id);
      TOTAL_PAGES = Math.ceil(SERVERS.length / SHOWN_ENTRIES);
      fillPagination();
      fillServers();
    } else {
      createPlaceholderForServers();
    }
  });
}

async function getCPUS(): Promise<Array<Record<string, any>> | null> {
  var cpus: APIResponse<Array<Record<string, any>>> = await fetchAPIResponse("/api/cpus");

  if (cpus.status === "success") {
    if (cpus.data) {
      return cpus.data;
    }
  } else {
    displayMessage(cpus.message ?? "Ошибка получения данных о процессорах", "error");
    console.error("Error fetching cpus:", cpus.message ?? "Unknown error");
  }
  return null;
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

function fillPagination(): void {
  const container: HTMLElement | null = document.querySelector("#servers_header .pagination .pagination_container");
  if (container) {
    container.replaceChildren();
    countPagination();
    for (let i = 1; i <= TOTAL_PAGES; i++) {
      const button = createElement("button", i.toString(), null, { "id": `page_${i}` });
      if (button) {
        button.addEventListener("click", () => {
          if (button.classList.contains("chosen") || DIALOG_OPENED) return;

          fillServers(i);
          countPagination(i);
        });
        container.appendChild(button);
      }
    }
  }
}

function countPagination(requested_page: number = 1): void {
  const pagination_count = document.querySelector("#servers_header .pagination .pagination_count");
  if (!pagination_count) return;

  if (pagination_count.classList.contains("skeleton")) pagination_count.classList.remove("skeleton");
  pagination_count.textContent = `${requested_page} / ${TOTAL_PAGES}`;
}

function highlightPaginationButton(requested_page: number): void {
  const container: HTMLElement | null = document.querySelector("#servers_header .pagination");
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

function fillServers(requested_page: number = 1): void {
  var shown_servers: Array<Record<string, any>> = [];

  if (requested_page <= TOTAL_PAGES) {
    shown_servers = SERVERS.slice((requested_page - 1) * SHOWN_ENTRIES, requested_page * SHOWN_ENTRIES)
    if (shown_servers.length > 0) {
      const container: HTMLElement | null = document.querySelector("#servers");
      if (container) {
        container.replaceChildren();
        shown_servers.forEach((server: Record<string, any>) => {
          const server_element = createServerElement(server);
          if (!server_element) return;

          container.appendChild(server_element);
          highlightPaginationButton(requested_page);
        });
      } else {
        console.error("Requests container not found");
      }
    } else {
      createPlaceholderForServers();
    }
  } else {
    createPlaceholderForServers();
  }
}

function createServerElement(server: Record<string, any>): HTMLElement | null {
  const server_element = createElement("div", null, ["server"], { "id": `server_${server.server_id}` });
  if (!server_element) return null;

  const name_block = createElement("div", null, ["server_block", "name_block"]);
  if (name_block) {
    createElement("p", server.server_id, ['monospaced'], null, name_block);
    createElement("h3", server.server_name, null, null, name_block);
    server_element.appendChild(name_block);
  }

  const space_block = createElement("div", null, ["server_block", "space_block"]);
  if (space_block) {
    createElement("p", "Место на диске", ['bold'], null, space_block);
    const space_string = server.server_space_total < 1048576 ? `${server.server_space_total / 1024} ГБ` : `${server.server_space_total / 1048576} ТБ`;
    const used_percentage = (server.server_space_reserved / server.server_space_total) * 100;
    createElement("p", `${space_string} (${used_percentage.toFixed(2)}% занято)`, null, null, space_block);
    server_element.appendChild(space_block);
  }

  const cpu_block = createElement("div", null, ["server_block", "cpu_block"]);
  if (cpu_block) {
    createElement("p", "Процессор", ['bold'], null, cpu_block);
    createElement("p", server.cpu_name, null, null, cpu_block);
    const cores_threads_string = `Ядра: ${server.cpu_cores} / Потоки: ${server.cpu_threads}`;
    createElement("p", cores_threads_string, null, null, cpu_block);
    createElement("p", `${server.cpu_frequency} МГц`, null, null, cpu_block);
    server_element.appendChild(cpu_block);
  }

  const action_block = createElement("div", null, ["server_block", "action_block"]);
  if (action_block) {
    const edit_button = createElement<HTMLButtonElement>("button", "Редактировать", null, { "style": `anchor-name: --edit-${server.server_id}` });
    if (!edit_button) return null;

    edit_button.addEventListener("click", (e) => {
      showServerDialog(e, server.server_id, server);
    });

    action_block.appendChild(edit_button);

    const delete_button = createElement<HTMLButtonElement>("button", "Удалить", ['destructive'], { "style": `anchor-name: --delete-${server.server_id}` });
    if (!delete_button) return null;

    delete_button.addEventListener("click", (e) => {
      showServerDeleteDialog(e, server.server_id);
    });

    action_block.appendChild(delete_button);

    server_element.appendChild(action_block);
  }

  return server_element;
}

function createPlaceholderForServers(): void {
  const container = document.querySelector("#servers");
  if (!container) return;

  container.replaceChildren();

  const placeholder = createElement("div", null, ["placeholder"]);
  if (!placeholder) return;

  createElement("h2", "Нет серверов", null, null, placeholder);
  createElement("p", "Создайте новый или попробуйте вернуться позже", null, null, placeholder);

  container.appendChild(placeholder);
}

function handleDialogClose(button: HTMLButtonElement, dialog: Element | null): void {
  button.classList.remove("opened");
  if (dialog) dialog.remove();
  DIALOG_OPENED = false;
}


async function saveServerData(payload: Record<string, string>): Promise<boolean> {
  const endpoint = payload.server_id ? "/api/admin/servers/edit" : "/api/admin/servers/create";
  const response = await fetchAPIResponse(endpoint, payload);
  return response.status === "success";
}

function showServerDialog(e: MouseEvent, server_id: number | null = null, server: Record<string, any> | null = null): void {
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


  const anchor_style = server_id ? `position-anchor: --edit-${server_id}` : "position-anchor: --new";
  const dialog = createElement("div", null, ["dialog", "server_dialog"], { "style": anchor_style });
  if (!dialog) return;

  const form = createElement<HTMLFormElement>("form");
  if (!form) return;

  createElement("h3", server_id ? "Редактировать сервер" : "Создать сервер", null, null, form);

  // server_name
  const name_block = createElement("div", null, ["input", "server_name_block"]);
  if (!name_block) return;
  createElement("label", "Название сервера", null, { "for": "server_name" }, name_block);
  createElement<HTMLInputElement>("input", null, null, { "id": "server_name", "name": "server_name", "type": "text", "required": "true" }, name_block);
  if (server) {
    name_block.querySelector<HTMLInputElement>("input")!.value = server.server_name;
  }
  form.appendChild(name_block);

  // server_space_total
  const space_block = createElement("div", null, ["input", "server_space_block"]);
  if (!space_block) return;
  createElement("label", "Общий объем памяти (МБ)", null, { "for": "server_space_total" }, space_block);
  createElement<HTMLInputElement>("input", null, null, { "id": "server_space_total", "name": "server_space_total", "type": "number", "required": "true" }, space_block);
  if (server) {
    const space_input = space_block.querySelector<HTMLInputElement>("input")!;
    if (!space_input) return;
    space_input.value = server.server_space_total.toString();
    space_input.min = server.server_space_reserved.toString();
  }
  form.appendChild(space_block);

  // cpu_id (select)
  const cpu_block = createElement("div", null, ["input", "cpu_select_block"]);
  if (!cpu_block) return;
  createElement("label", "Процессор", null, { "for": "cpu_id" }, cpu_block);
  form.appendChild(cpu_block);

  const select_wrap = createElement("div", null, ["select_wrap"]);
  if (!select_wrap) return;
  const select_cpu = createElement<HTMLSelectElement>("select", null, null, { "name": "cpu_id", "id": "cpu_id", "required": "true" });
  if (!select_cpu) return;

  // Опции процессоров должны быть получены с сервера, здесь добавляется статичная опция для создания
  createElement("option", "Создать новый процессор", null, { "value": "new" }, select_cpu);

  if (CPUS) {
    for (const cpu of CPUS) {
      const option = createElement<HTMLOptionElement>("option", cpu.cpu_name, null, { "value": cpu.cpu_id });
      if (!option) continue;

      if (server && cpu.cpu_id === server.cpu_id) {
        option.selected = true;
      }
      select_cpu.appendChild(option);
    }
  }

  select_wrap.appendChild(select_cpu);

  createElement("div", null, ["select_chevron"], null, select_wrap);

  cpu_block.appendChild(select_wrap);

  // Контейнер для полей нового процессора
  const new_cpu_container = createElement("div", null, ["new_cpu_container"], { "style": `display: ${select_cpu.value === "new" ? "block" : "none"}` });
  if (!new_cpu_container) return;

  // cpu_name
  const cpu_name_block = createElement("div", null, ["input"]);
  if (!cpu_name_block) return;
  createElement("label", "Модель процессора", null, { "for": "cpu_name" }, cpu_name_block);
  const input_cpu_name = createElement<HTMLInputElement>("input", null, null, { "id": "cpu_name", "name": "cpu_name", "type": "text" });
  if (!input_cpu_name) return;

  // cpu_cores
  const cpu_cores_block = createElement("div", null, ["input"]);
  if (!cpu_cores_block) return;
  createElement("label", "Количество ядер", null, { "for": "cpu_cores" }, cpu_cores_block);
  const input_cpu_cores = createElement<HTMLInputElement>("input", null, null, { "id": "cpu_cores", "name": "cpu_cores", "type": "number" });
  if (!input_cpu_cores) return;

  // cpu_threads
  const cpu_threads_block = createElement("div", null, ["input"]);
  if (!cpu_threads_block) return;
  createElement("label", "Количество потоков", null, { "for": "cpu_threads" }, cpu_threads_block);
  const input_cpu_threads = createElement<HTMLInputElement>("input", null, null, { "id": "cpu_threads", "name": "cpu_threads", "type": "number" });
  if (!input_cpu_threads) return;

  // cpu_frequency
  const cpu_freq_block = createElement("div", null, ["input"]);
  if (!cpu_freq_block) return;
  createElement("label", "Базовая частота (МГц)", null, { "for": "cpu_frequency" }, cpu_freq_block);
  const input_cpu_freq = createElement<HTMLInputElement>("input", null, null, { "id": "cpu_frequency", "name": "cpu_frequency", "type": "number" });
  if (!input_cpu_freq) return;

  select_cpu.addEventListener("change", () => {
    const is_new = select_cpu.value === "new";
    new_cpu_container.style.display = is_new ? "block" : "none";
    if (input_cpu_name) input_cpu_name.required = is_new;
    if (input_cpu_cores) input_cpu_cores.required = is_new;
    if (input_cpu_threads) input_cpu_threads.required = is_new;
    if (input_cpu_freq) input_cpu_freq.required = is_new;
  });

  cpu_name_block.appendChild(input_cpu_name);
  new_cpu_container.appendChild(cpu_name_block);

  cpu_cores_block.appendChild(input_cpu_cores);
  new_cpu_container.appendChild(cpu_cores_block);

  cpu_threads_block.appendChild(input_cpu_threads);
  new_cpu_container.appendChild(cpu_threads_block);

  cpu_freq_block.appendChild(input_cpu_freq);
  new_cpu_container.appendChild(cpu_freq_block);

  form.appendChild(new_cpu_container);

  createElement("button", "Сохранить", ["accent"], { "type": "submit" }, form);

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
    const form = e.currentTarget as HTMLFormElement;
    if (!form) return;

    const input_name = form.querySelector<HTMLInputElement>("#server_name");
    const input_space = form.querySelector<HTMLInputElement>("#server_space_total");
    const select_cpu = form.querySelector<HTMLSelectElement>("#cpu_id");
    if (!input_name || !input_space || !select_cpu) return;

    const payload: Record<string, string> = {
      server_name: input_name.value,
      server_space_total: input_space.value,
      cpu_id: select_cpu.value
    };

    if (server_id) {
      payload.server_id = server_id.toString();
    }

    if (select_cpu.value === "new") {
      const input_cpu_name = form.querySelector<HTMLInputElement>("#cpu_name");
      const input_cpu_cores = form.querySelector<HTMLInputElement>("#cpu_cores");
      const input_cpu_threads = form.querySelector<HTMLInputElement>("#cpu_threads");
      const input_cpu_freq = form.querySelector<HTMLInputElement>("#cpu_frequency");
      if (!input_cpu_name || !input_cpu_cores || !input_cpu_threads || !input_cpu_freq) return;

      payload.cpu_name = input_cpu_name.value;
      payload.cpu_cores = input_cpu_cores.value;
      payload.cpu_threads = input_cpu_threads.value;
      payload.cpu_frequency = input_cpu_freq.value;
    }

    if (await saveServerData(payload)) {
      displayMessage("Сервер успешно сохранен");
      button.classList.remove("opened");
      dialog.remove();
      DIALOG_OPENED = false;
      getServersWrap();
    } else {
      displayMessage("Ошибка при сохранении сервера", "error");
    }
  });

  dialog.appendChild(form);

  const container_id = server_id ? `#server_${server_id}` : "#servers_header";
  const container = document.querySelector(container_id);
  if (!container) return;

  container.appendChild(dialog);
  button.classList.add("opened");
  DIALOG_OPENED = true;
}

async function deleteServer(server_id: number): Promise<boolean> {
  const payload: Record<string, string> = {
    server_id: server_id.toString()
  };
  const response = await fetchAPIResponse("/api/admin/servers/delete", payload);
  return response.status === "success";
}

function showServerDeleteDialog(e: MouseEvent, server_id: number): void {
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

  const dialog = createElement("div", null, ["dialog", "delete_dialog"], { "style": `position-anchor: --delete-${server_id}` });
  if (!dialog) return;

  const form = createElement<HTMLFormElement>("form");
  if (!form) return;

  createElement("h3", "Удалить сервер", null, null, form);

  createElement("p", "Вы уверены, что хотите безвозвратно удалить этот сервер? Связанные хостинги будут также удалены, хотя заявки на них останутся активными.", null, null, form);
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

    if (await deleteServer(server_id)) {
      displayMessage("Сервер успешно удален");
      handleDialogClose(button, dialog);
      getServersWrap();
    } else {
      displayMessage("Ошибка при удалении сервера", "error");
    }
  });

  dialog.appendChild(form);

  const server_container = document.querySelector(`#server_${server_id}`);
  if (!server_container) return;
  server_container.appendChild(dialog);
  DIALOG_OPENED = true;
}

document.addEventListener("DOMContentLoaded", main);
