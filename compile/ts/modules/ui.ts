import { getMidpoint, createElement } from "./utils.js";
import { fetchAPIResponse } from "./api.js";

var LOG_OUT_MODAL_OPENED: boolean = false;

export function changeHeaderColorOnScroll() {
  const header = document.querySelector("header");
  if (header) {
    window.addEventListener("scroll", () => {
      const change_threshold = getMidpoint(header.offsetHeight);
      if (window.scrollY > change_threshold) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    });
  } else {
    console.error("Header not found");
  }
}

export function burgerButtonListenerSetup(): void {
  const burger_button: HTMLButtonElement | null = document.querySelector("header .burger");
  const burger_menu: HTMLElement | null = document.querySelector(".burger_menu");
  if (burger_button && burger_menu) {
    burger_button.addEventListener("click", () => {
      burger_menu.classList.toggle("open");
    });
  } else {
    console.error("Burger button and/or burger menu not found");
  }
}

export async function changeHeaderAuthButtons() {
  const header_account_nav: HTMLElement | null = document.querySelector("header .account_nav");
  const burger_account_nav: HTMLElement | null = document.querySelector(".burger_menu .account_nav");

  if (header_account_nav && burger_account_nav) {
    const response = await fetchAPIResponse<Array<any>>("/api/requests/total");

    if (response.status === "success" && response.data) {
      const auth_buttons = createElement("div", null, ["auth_buttons"]);
      if (auth_buttons) {
        createElement("button", `Заявок: ${response.data[0]}`, null, { "onclick": "window.location.href = '/dashboard'" }, auth_buttons);

        const new_request_button = createElement("button", null, [ "tooltipped" ], { "onclick": "window.location.href = '/request'", "style": "anchor-name: --auth-1" });
        if (new_request_button) {
          createElement("img", null, null, { "src": "/media/icons/new_request.svg", "alt": "Новая заявка" }, new_request_button);
          createElement("p", "Новая заявка", [ "tooltip" ], { "style": "position-anchor: --auth-1" }, new_request_button);
          auth_buttons.appendChild(new_request_button);
        }

        if (response.data[1] === 2) {
          const admin_button = createElement("button", null, [ "tooltipped" ], { "onclick": "window.location.href = '/admin'", "style": "anchor-name: --auth-2" });
          if (admin_button) {
            createElement("img", null, null, { "src": "/media/icons/admin.svg", "alt": "Админ-панель" }, admin_button);
            createElement("p", "Админ-панель", [ "tooltip" ], { "style": "position-anchor: --auth-2" }, admin_button);
            auth_buttons.appendChild(admin_button);
          }
        }

        const log_out_button = createElement("button", null, [ "tooltipped" ], { "style": "anchor-name: --auth-3", "id": "auth-3" });
        if (log_out_button) {
          createElement("img", null, null, { "src": "/media/icons/log_out.svg", "alt": "Выйти" }, log_out_button);
          createElement("p", "Выйти", [ "tooltip" ], { "style": "position-anchor: --auth-3" }, log_out_button);
          auth_buttons.appendChild(log_out_button);
        }

        header_account_nav.replaceChildren(auth_buttons.cloneNode(true));
        burger_account_nav.replaceChildren(auth_buttons);

        const created_buttons: NodeListOf<HTMLButtonElement> | null = document.querySelectorAll(".auth_buttons button:last-child");
        if (created_buttons) {
          created_buttons.forEach(button => {
            button.addEventListener("click", (e) => showLogOutModal(e, true));
          })
        }
      }
    }

  } else {
    console.error("Header and/or burger account_nav not found");
  }
}

export async function logOutEvent(e: MouseEvent): Promise<void> {
  if (e.target) {
    const button: HTMLButtonElement = e.currentTarget as HTMLButtonElement;
    changeButtonState(button);

    const response = await fetchAPIResponse("/api/auth/log-out");
    if (response.status === "success") {
      window.location.reload();
      changeButtonState(button);
    }
  }
}

export function changeButtonState(button: HTMLButtonElement): void {
  button.classList.toggle("standby");
  button.disabled = !button.disabled;
}

export function showLogOutModal(e: MouseEvent, place_in_header: boolean = false): void {
  const button: HTMLButtonElement = e.currentTarget as HTMLButtonElement;

  if (button.classList.contains("opened")) {
    button.classList.remove("opened");
    const created_modal = document.querySelector(".log_out_modal");
    if (created_modal) {
      created_modal.remove();
      LOG_OUT_MODAL_OPENED = false;
    }
    return;
  }

  if (LOG_OUT_MODAL_OPENED) {
    return;
  }

  button.classList.add("opened");

  const log_out_modal = createElement("div", null, ["modal", "log_out_modal"], { "style": `position-anchor: --${button.id}` });
  if (log_out_modal) {
    createElement("p", "Выйти из аккаунта?", null, null, log_out_modal);
    const button_div = createElement("div");
    if (button_div) {
      const log_out_button = createElement("button", "Выйти", ["destructive"]);
      if (log_out_button) {
        log_out_button.addEventListener("click", (e) => logOutEvent(e));
        button_div.appendChild(log_out_button);
      }
      const cancel_button = createElement("button", "Отменить");
      if (cancel_button) {
        cancel_button.addEventListener("click", () => {
          button.classList.remove("opened");
          log_out_modal.remove();
          LOG_OUT_MODAL_OPENED = false;
        });
        button_div.appendChild(cancel_button);
      }
      log_out_modal.appendChild(button_div);
    }

    if (place_in_header) {
      const header = document.querySelector("header");
      if (header) {
        header.appendChild(log_out_modal);
      }
    } else {
      document.body.appendChild(log_out_modal);
    }

    LOG_OUT_MODAL_OPENED = true;
  }
}
