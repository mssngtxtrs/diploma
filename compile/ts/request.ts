import { changeHeaderColorOnScroll, changeHeaderAuthButtons, burgerButtonListenerSetup } from "./modules/ui.js";
import { displayMessagesFromServer } from "./modules/messages.js";
import { fetchAPIResponse } from "./modules/api.js";
import { displayMessage, createElement } from "./modules/utils.js";
import type { HostingFull } from "./types/hostings.js";

var HOSTINGS: Array<HostingFull> = [];
var MONTHS: number = 3;
var PRICE_PER_MONTH: number = 0;
var HOSTINGS_DROPDOWN_OPENED = false;

async function main(): Promise<void> {
  displayMessagesFromServer();
  changeHeaderColorOnScroll();
  changeHeaderAuthButtons();
  burgerButtonListenerSetup();

  await getHostings().then(() => pasteHostingFromGETQuery());
  setupListeners();
}

function setupListeners(): void {
  const range = document.querySelector<HTMLInputElement>("#months");
  if (range) {
    const span = document.querySelector<HTMLSpanElement>("#months ~ span");
    if (span) {
      range.addEventListener("input", () => {
        MONTHS = parseInt(range.value);
        recalculatePrice();
        span.textContent = range.value;
      });
    }
  }

  const hosting_select = document.querySelector<HTMLSelectElement>(".select_block");
  if (hosting_select) {
    hosting_select.addEventListener("click", () => toggleDropdown("hosting"));
  }

  const submit_button = document.querySelector<HTMLButtonElement>("#submit button");
  const form = document.querySelector<HTMLFormElement>("#form");
  if (submit_button && form) {
    form.addEventListener("submit", submitOverride);
    submit_button.addEventListener("click", () => { sendRequest(form); });
  }
}

async function submitOverride(e: SubmitEvent): Promise<void> {
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;
  await sendRequest(form);
}

async function sendRequest(form: HTMLFormElement): Promise<void> {
  const form_data = new FormData(form);

  if (!validateForm(form)) {
    displayMessage("Выберите хостинг", "error");
    return;
  }

  const payload: Record<string, string> = {
    "hosting_id": form_data.get("hosting")?.toString() ?? "",
    "request_months": form_data.get("months")?.toString() ?? "",
    "request_note": form_data.get("note")?.toString() ?? ""
  };

  const response = await fetchAPIResponse<Record<string, any>>("/api/request", payload);

  if (response.status === "error") {
    displayMessage(response.message ?? "Не удалось создать заявку", "error");
    return;
  }

  if (response.data) {
    if (response.data.response === false) {
      displayMessage(response.data.message ?? "Не удалось создать заявку", "error");
      return;
    }

    window.location.href = "/dashboard";
  }
}

function validateForm(form: HTMLFormElement): boolean {
  const input = form.querySelector<HTMLInputElement>("input[type='hidden']");
  if (!input) return false;

  return input.value.trim().length > 0;
}

function toggleDropdown(anchor: string = ""): void {
  if (HOSTINGS_DROPDOWN_OPENED) {
    HOSTINGS_DROPDOWN_OPENED = false;
    const select = document.querySelector<HTMLParagraphElement>("#hosting ~ .select_block");
    if (select) select.classList.remove("opened");

    const dropdown = document.querySelector<HTMLDivElement>(".hostings_dropdown");
    if (dropdown) dropdown.remove();
    return;
  }

  HOSTINGS_DROPDOWN_OPENED = true;
  const select = document.querySelector<HTMLParagraphElement>("#hosting ~ .select_block");
  if (select) select.classList.add("opened");

  const form = document.querySelector<HTMLFormElement>("#form");
  if (!form) return;

  const dropdown = createElement("div", null, ["dropdown", "hostings_dropdown"], { "style": `position-anchor: --${anchor}` });
  if (dropdown) {
    const input = createElement<HTMLInputElement>("input", null, null, { "placeholder": "Поиск..." });
    if (input) {
      input.addEventListener("keyup", () => {
        const query = input.value.toLowerCase();
        const list = dropdown.querySelector<HTMLDivElement>(".hostings_list");
        if (!list) return;

        const items = Array.from(list.children as HTMLCollectionOf<HTMLDivElement>);
        items.forEach((item) => {
          const hosting_name = (item as HTMLDivElement).querySelector("h3");
          if (!hosting_name) return;

          const text_value = hosting_name.textContent || hosting_name.innerText;
          if (!text_value) return;

          // if (text_value.toLowerCase().includes(query)) {
          if (text_value.toLowerCase().indexOf(query) > -1) {
            item.style.display = "";
          } else {
            item.style.display = "none";
          }
        });
      });
      dropdown.appendChild(input);
    }

    const list = createElement("div", null, ["dropdown_list", "hostings_list"]);
    if (list) {
      HOSTINGS.forEach((hosting) => {
        if (hosting.invalid) return;

        const item = createElement("div", null, ["dropdown_item", "hosting_item"]);
        if (item) {
          createElement("h3", hosting.name, null, null, item);
          const ram = hosting.ram < 1048576 ? `${hosting.ram / 1024} ГБ` : `${hosting.ram / 1048576} ТБ`;
          const space = hosting.space < 1048576 ? `${hosting.space / 1024} ГБ` : `${hosting.space / 1048576} ТБ`;
          createElement("p", `${hosting.price_per_month} ₽/мес. | ${hosting.vcpu} vCPU | ${ram} RAM | ${space}`, null, null, item);

          item.addEventListener("click", () => {
            const hosting_id = hosting.id;
            const hosting_name = hosting.name;
            PRICE_PER_MONTH = hosting.price_per_month;
            recalculatePrice();

            const input = form.querySelector<HTMLInputElement>("input[type='hidden']");
            if (!input) return;
            input.value = hosting_id.toString();

            const select_block = form.querySelector<HTMLParagraphElement>(".select_block");
            if (!select_block) return;
            select_block.classList.remove("opened");
            select_block.textContent = hosting_name;

            toggleDropdown();
          });
          list.appendChild(item);
        }
      });
      dropdown.appendChild(list);
    }

    form.appendChild(dropdown);
  }
}

function recalculatePrice(): void {
  const price_block = document.querySelector<HTMLHeadingElement>("#submit h3");
  if (!price_block) return;
  var month_text: string;
  switch (MONTHS) {
    case 3:
      month_text = "месяца";
      break;
    default:
      month_text = "месяцев";
      break;
  }

  price_block.textContent = `${PRICE_PER_MONTH * MONTHS} ₽ за ${MONTHS} ${month_text}`;
}

function convertHostings(response: Record<string, any>): Array<HostingFull> {
  var output: Array<HostingFull> = [];

  for (const [, hosting] of Object.entries(response)) {
    output.push({
      id: hosting.hosting_id,
      name: hosting.hosting_name,
      ram: hosting.hosting_ram,
      space: hosting.hosting_space,
      vcpu: hosting.hosting_vcpu,
      traffic: hosting.hosting_traffic,
      price_per_month: hosting.price_per_month,
      invalid: hosting.invalid,
      server: {
        id: hosting.server_id,
        name: hosting.server_name,
        cpu: {
          id: hosting.cpu_id,
          name: hosting.cpu_name,
          cores: hosting.cpu_cores,
          threads: hosting.cpu_threads,
          frequency: hosting.cpu_frequency,
        }
      }
    });
  }

  return output;
}

async function getHostings(): Promise<Array<HostingFull> | undefined> {
  const hostings_response = await fetchAPIResponse("/api/hostings");

  if (hostings_response.status === "error") {
    displayMessage("Ошибка при обращении к серверу");
    console.log(hostings_response.message);
    return undefined;
  }

  if (hostings_response.data) {
    const converted: Array<HostingFull> | null = convertHostings(hostings_response.data);
    if (converted) {
      HOSTINGS = converted;
    }
  }
}

function pasteHostingFromGETQuery(): void {
  const url_params = new URLSearchParams(window.location.search);
  const hosting_id = url_params.get("id");
  if (hosting_id) {
    const hosting = HOSTINGS.find(hosting => hosting.id === parseInt(hosting_id));
    if (hosting) {
      PRICE_PER_MONTH = hosting.price_per_month;
      recalculatePrice();

      const input = document.querySelector<HTMLInputElement>("#form input[type='hidden']");
      if (!input) return;
      input.value = hosting.id.toString();

      const select_block = document.querySelector<HTMLParagraphElement>("#form .select_block");
      if (!select_block) return;
      select_block.classList.remove("opened");
      select_block.textContent = hosting.name;
    }
  }
}

document.addEventListener("DOMContentLoaded", main);
