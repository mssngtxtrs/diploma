import { fetchAPIResponse } from "./modules/api.js";
import { displayMessage, createElement, getMidpoint } from "./modules/utils.js";
// import { changeHeaderColorOnScroll } from "./modules/ui.js";
import { changeHeaderAuthButtons, burgerButtonListenerSetup } from "./modules/ui.js";
import { displayMessagesFromServer } from "./modules/messages.js";
import type { Hosting } from "./types/hostings.js";

async function main(): Promise<void> {
  // changeHeaderColorOnScroll();
  changeHeaderAuthButtons();
  displayMessagesFromServer();
  burgerButtonListenerSetup();

  var hostings = await getHostings();
  if (hostings) {
    const container = document.querySelector("#page_3 .slider_container");
    if (container) {
      container.replaceChildren();
      for (const hosting of hostings) {
        const slide = makeSlide(hosting);
        if (slide) {
          container.appendChild(slide);
        } else {
          console.error("Error creating slide for hosting", hosting);
        }
      }

      addSliderListeners();
    } else {
      console.error("slider_container not found");
    }
  } else {
    console.error("Error getting hostings info");
  }

  changeBackgroundOnScroll();
}

function convertHostings(response: Record<string, any>): Array<Hosting> {
  var output: Array<Hosting> = [];

  for (const [, hosting] of Object.entries(response)) {
    output.push({
      id: hosting.hosting_id,
      name: hosting.hosting_name,
      ram: hosting.hosting_ram,
      space: hosting.hosting_space,
      vcpu: hosting.hosting_vcpu,
      traffic: hosting.hosting_traffic,
      price_per_month: hosting.price_per_month,
      invalid: hosting.invalid
    });
  }

  return output;
}

async function getHostings(): Promise<Array<Hosting> | undefined> {
  const hostings_response = await fetchAPIResponse("/api/hostings");

  if (hostings_response.status === "error") {
    displayMessage("Ошибка при обращении к серверу");
    console.log(hostings_response.message);
    return undefined;
  }

  if (hostings_response.data) {
    const converted: Array<Hosting> | null = convertHostings(hostings_response.data);
    if (converted) {
      return converted;
    }
  }
}

function makeSlide(hosting: Hosting): HTMLElement | undefined {
  const slide_container = createElement("div", null, ["slide"], { "id": hosting.id.toString() });

  if (slide_container) {
    createElement("h3", hosting.name, null, null, slide_container);

    const price_block = createElement("div", null, [ "slide_block", "price_block" ]);
    if (price_block) {
      createElement("p", `${hosting.price_per_month}₽/мес.`, null, null, price_block);
      slide_container.appendChild(price_block);
    }

    const vcpu_block = createElement("div", null, [ "slide_block", "vcpu_block" ]);
    if (vcpu_block) {
      createElement("img", null, null, { "src": "/media/icons/vcpu.svg", "alt": "vCPU" }, vcpu_block);
      createElement("p", "Процессор", null, null, vcpu_block);
      createElement("p", `${hosting.vcpu} x vCPU`, null, null, vcpu_block);
      slide_container.appendChild(vcpu_block);
    }

    const ram_block = createElement("div", null, [ "slide_block", "ram_block" ]);
    if (ram_block) {
      const ram = hosting.ram < 1048576 ? `${hosting.ram / 1024} ГБ` : `${hosting.ram / 1048576} ТБ`;
      createElement("img", null, null, { "src": "/media/icons/ram.svg", "alt": "ОЗУ" }, ram_block);
      createElement("p", "Оперативная память", null, null, ram_block);
      createElement("p", `${ram}`, null, null, ram_block);
      slide_container.appendChild(ram_block);
    }

    const space_block = createElement("div", null, [ "slide_block", "space_block" ]);
    if (space_block) {
      const space = hosting.space < 1048576 ? `${hosting.space / 1024} ГБ` : `${hosting.space / 1048576} ТБ`;
      createElement("img", null, null, { "src": "/media/icons/space.svg", "alt": "Объём диска" }, space_block);
      createElement("p", "Объём диска", null, null, space_block);
      createElement("p", `${space}`, null, null, space_block);
      slide_container.appendChild(space_block);
    }

    const traffic_block = createElement("div", null, [ "slide_block", "traffic_block" ]);
    if (traffic_block) {
      createElement("img", null, null, { "src": "/media/icons/traffic.svg", "alt": "Трафик" }, traffic_block);
      createElement("p", "Ежемесячный трафик", null, null, traffic_block);
      createElement("p", `${hosting.traffic} ГБ, далее - ограничение скорости до 10 Мбит/с`, null, null, traffic_block);
      slide_container.appendChild(traffic_block);
    }

    const request_block = createElement("div", null, [ "slide_block", "request_block" ]);
    if (request_block) {
      const button = createElement<HTMLButtonElement>("button", "Арендовать", ['accent'], { "onclick": `window.location.href = "/request?id=${hosting.id}"` });
      if (button) {
        if (hosting.invalid) {
          button.textContent = "Недоступен";
          button.disabled = true;
        }
        request_block.appendChild(button);
      }
      slide_container.appendChild(request_block);
    }

    return slide_container;
  }

  return undefined;
}

function addSliderListeners(): void {
  const slider_buttons: NodeListOf<HTMLButtonElement> | null = document.querySelectorAll("#page_3 .slider > button");
  if (slider_buttons) {
    const slider: HTMLElement | null = document.querySelector("#page_3 .slider_container");

    if (slider_buttons[0]) toggleButton(slider_buttons[0], true);

    if (slider) {
      slider_buttons.forEach((button) => {
        switch (button.id) {
          case "prev_button":
            button.addEventListener("click", () => {
              changeSlide(slider, "prev");
            });
            break;
          case "next_button":
            button.addEventListener("click", () => {
              changeSlide(slider, "next");
            });
            break;
        }
      });

      slider.addEventListener("scroll", () => {
        const current_scroll = slider.scrollLeft;
        const trigger_threshold = getMidpoint(slider.clientWidth);
        const scroll_width = slider.scrollWidth - slider.clientWidth;

        const prev_button: HTMLButtonElement | undefined = slider_buttons ? slider_buttons[0] : undefined;
        const next_button: HTMLButtonElement | undefined = slider_buttons ? slider_buttons[1] : undefined;

        switch (true) {
          case current_scroll <= trigger_threshold:
            if (prev_button) {
              if (prev_button.disabled === false) {
                toggleButton(prev_button, true);
              }
            }
            break;
          case current_scroll >= scroll_width - trigger_threshold:
            if (next_button) {
              if (next_button.disabled === false) {
                toggleButton(next_button, true);
              }
            }
            break;
          case current_scroll > trigger_threshold && current_scroll < scroll_width - trigger_threshold:
            if (prev_button && next_button) {
              if (prev_button.disabled === true || next_button.disabled === true) {
                toggleButton(prev_button, false);
                toggleButton(next_button, false);
              }
            }
            break;
        }
      })
    }
  }
}


function toggleButton(button: HTMLButtonElement, disabled: boolean): void {
  button.disabled = disabled;
}

function changeSlide(slider: HTMLElement, direction: "prev" | "next"): void {
  const scroll_amount = direction === "next" ? slider.clientWidth : -slider.clientWidth;
  slider.scrollBy({ left: scroll_amount });
}

function changeBackgroundOnScroll(): void {
  const background: HTMLElement | null = document.querySelector(".background");
  const scroll_container: HTMLElement | null = document.querySelector(".pages_container");

  if (background && scroll_container) {
    const scroll_threshold: number = scroll_container.clientHeight;

    scroll_container.addEventListener("scroll", () => {
      const scroll_position: number = scroll_container.scrollTop;

      switch (true) {
        case scroll_position <= scroll_threshold - getMidpoint(scroll_threshold):
          background.style.setProperty('--bg-mask', 'var(--secondary-hover)');
          break;
        case scroll_position <= scroll_threshold * 2 - getMidpoint(scroll_threshold):
          background.style.setProperty('--bg-mask', 'var(--secondary-active)');
          break;
        case scroll_position <= scroll_threshold * 3 - getMidpoint(scroll_threshold):
          background.style.setProperty('--bg-mask', '#383838');
          break;
        default:
          background.style.setProperty('--bg-mask', 'var(--bg)');
          break;
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", main);
