import { getMidpoint, createElement } from "./utils.js";
import { fetchAPIResponse } from "./api.js";

var LOG_OUT_DIALOG_OPENED: boolean = false;

type LinkType = "requests" | "users" | "servers" | "hostings";
type DialogPlacement = "header" | "burger" | "else";

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

        const burger_button: HTMLButtonElement | null = document.querySelector(".burger_menu .auth_buttons #auth-3");
        const header_button: HTMLButtonElement | null = document.querySelector("header .auth_buttons #auth-3");
        if (burger_button) {
          burger_button.addEventListener("click", (e) => showLogOutdialog(e, "burger"));
        }
        if (header_button) {
          header_button.addEventListener("click", (e) => showLogOutdialog(e, "header"));
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

export function showLogOutdialog(e: MouseEvent, dialog_placement: DialogPlacement = "else"): void {
  const button: HTMLButtonElement = e.currentTarget as HTMLButtonElement;

  if (button.classList.contains("opened")) {
    button.classList.remove("opened");
    const created_dialog = document.querySelector(".log_out_dialog");
    if (created_dialog) {
      created_dialog.remove();
      LOG_OUT_DIALOG_OPENED = false;
    }
    return;
  }

  if (LOG_OUT_DIALOG_OPENED) {
    return;
  }

  button.classList.add("opened");

  const log_out_dialog = createElement("div", null, ["dialog", "log_out_dialog"], { "style": `position-anchor: --${button.id}` });
  if (log_out_dialog) {
    const form = createElement<HTMLFormElement>("form");
    if (!form) return;

    createElement("h3", "Выйти из аккаунта?", null, null, form);
    const button_div = createElement("div", null, ["button_block"]);
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
          log_out_dialog.remove();
          LOG_OUT_DIALOG_OPENED = false;
        });
        button_div.appendChild(cancel_button);
      }
      form.appendChild(button_div);
      log_out_dialog.appendChild(form);
    }

    if (dialog_placement === "header") {
      const header = document.querySelector("header");
      if (header) {
        header.appendChild(log_out_dialog);
      }
    } else if (dialog_placement === "burger") {
      const burger = document.querySelector(".burger_menu");
      if (burger) {
        burger.appendChild(log_out_dialog);
      }
    } else {
      document.body.appendChild(log_out_dialog);
    }

    LOG_OUT_DIALOG_OPENED = true;
  }
}

export function highlightActiveLink(link_type: LinkType): void {
  const active_link = document.querySelector<HTMLAnchorElement>(`#admin_header a.${link_type}_link`);
  if (active_link) {
    active_link.href = "#";
    active_link.classList.remove("underlined");
  }
}
