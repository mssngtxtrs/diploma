import { getMidpoint, createElement } from "./utils.js";
import { fetchAPIResponse } from "./api.js";

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

export async function changeHeaderAuthButtons() {
  const header_account_nav: HTMLElement | null = document.querySelector("header .account_nav");
  if (header_account_nav) {
    const response = await fetchAPIResponse("/api/requests/total");

    if (response.status === "success" && response.data) {
      const auth_buttons = createElement("div", null, ["auth_buttons"]);
      if (auth_buttons) {
        createElement("button", `Заявок: ${response.data}`, null, { "onclick": "window.location.href = '/dashboard'" }, auth_buttons);

        const new_request_button = createElement("button", null, [ "tooltipped" ], { "onclick": "window.location.href = '/request'" });
        if (new_request_button) {
          createElement("img", null, null, { "src": "/media/icons/new_request.svg", "alt": "🞣" }, new_request_button);
          createElement("p", "Новая заявка", [ "tooltip" ], null, new_request_button);
          auth_buttons.appendChild(new_request_button);
        }

        const log_out_button = createElement("button", null, [ "tooltipped" ]);
        if (log_out_button) {
          createElement("img", null, null, { "src": "/media/icons/log_out.svg", "alt": "Выйти" }, log_out_button);
          createElement("p", "Выйти", [ "tooltip" ], null, log_out_button);

          log_out_button.addEventListener("click", async (e) => {
            if (e.target) {
              const button: HTMLButtonElement = e.target as HTMLButtonElement;
              changeButtonState(button);

              const response = await fetchAPIResponse("/api/auth/log-out");
              if (response.status === "success") {
                window.location.href = "/";
                changeButtonState(button);
              }
            }
          });

          auth_buttons.appendChild(log_out_button);
        }

        header_account_nav.replaceChildren(auth_buttons);
      }
    }

  } else {
    console.error("Header account_nav not found");
  }
}

export function changeButtonState(button: HTMLButtonElement): void {
  button.classList.toggle("standby");
  button.disabled = !button.disabled;
}
