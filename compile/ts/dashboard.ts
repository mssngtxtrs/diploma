import { changeHeaderColorOnScroll, changeHeaderAuthButtons, burgerButtonListenerSetup, logOutEvent } from "./modules/ui.js";
import { displayMessagesFromServer } from "./modules/messages.js";
import { displayMessage, createElement } from "./modules/utils.js";
import { fetchAPIResponse } from "./modules/api.js";

async function main(): Promise<void> {
  displayMessagesFromServer();
  changeHeaderColorOnScroll();
  changeHeaderAuthButtons();
  burgerButtonListenerSetup();

  fillPersonalInfo();
  listenersSetup();
  await fillFilterOptions();
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

        const total_container: HTMLParagraphElement | null = personal_text_container.querySelector("p:last-of-type");
        if (total_container) {
          const total_string: string = `Всего запросов: ${dashboard_info.data['requests_total']}`;
          total_container.classList.remove("skeleton");
          total_container.textContent = total_string;
        } else {
          console.error("Level container not found");
        }


      }
    }
  } else {
    displayMessage("Ошибка получения данных о пользователе", "error");
    console.error(`Error recieving credentials from server: ${dashboard_info.message ?? 'Unknown error'}`)
  }
}

async function fillRequests(): Promise<void> {

}

// function createRequestElement(): HTMLElement | null {

// }

async function fillFilterOptions(): Promise<void> {
  var filter_options = await fetchAPIResponse<Record<string, any>>("/api/requests/filter");
  if (filter_options.status === "success") {
    if (filter_options.data) {
      const filter_options_select: HTMLSelectElement | null = document.querySelector("#filter");
      if (filter_options_select) {
        filter_options_select.classList.remove("skeleton");
        filter_options_select.replaceChildren();
        for (const option of Object.entries(filter_options.data)) {
          const option_block = createElement<HTMLOptionElement>("option", option[1].state_name, null, { value: option[1].state_id });
          if (option_block) {
            if (option_block.value === "1") {
              option_block.selected = true;
            }
            filter_options_select.appendChild(option_block);
          }
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

function listenersSetup(): void {
  const log_out_button: HTMLButtonElement | null = document.querySelector("#personal button:last-of-type");
  if (log_out_button) {
    log_out_button.addEventListener("click", (e) => logOutEvent(e));
  }
}

document.addEventListener("DOMContentLoaded", main);
