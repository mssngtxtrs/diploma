import { fetchAPIResponse } from "./modules/api.js";
import { displayMessage, createElement } from "./modules/utils.js";
// import { changeHeaderColorOnScroll } from "./modules/ui.js";
import { displayMessagesFromServer } from "./modules/messages.js";
import type { Hosting } from "./types/hostings.js";

async function main(): Promise<void> {
  // changeHeaderColorOnScroll();
  displayMessagesFromServer();
  var servers = await getHostings();
  if (servers) {
    const container = document.querySelector("#page_3 .slider_container");
    if (container) {
      for (const server of servers) {
        const slide = makeSlide(server);
        if (slide) {
          container.appendChild(slide);
        } else {
          console.error("Error creating slide for server", server);
        }
      }

      addSliderListeners();
    } else {
      console.error("slider_container not found");
    }
  } else {
    console.error("Error getting servers");
  }
}

function convertHostings(response: Record<string, any>): Array<Hosting> {
  var output: Array<Hosting> = [];

  for (const [, hosting] of Object.entries(response)) {
    output.push({
      id: hosting.hosting_id,
      name: hosting.hosting_name,
      server_name: hosting.server_name,
      ram: hosting.hosting_ram,
      space: hosting.hosting_space,
      vcpu: hosting.hosting_vcpu,
      traffic: hosting.hosting_traffic,
      price_per_month: hosting.price_per_month
    });
  }

  return output;
}

async function getHostings(): Promise<Array<Hosting> | undefined> {
  const servers_response = await fetchAPIResponse("/api/hostings");

  if (servers_response.status === "error") {
    displayMessage("Ошибка при обращении к серверу");
    console.log(servers_response.message);
    return undefined;
  }

  if (servers_response.data) {
    const converted: Array<Hosting> | null = convertHostings(servers_response.data);
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
      createElement("img", null, null, { "src": "/media/icons/vcpu.svg" }, vcpu_block);
      createElement("p", "Процессор", null, null, vcpu_block);
      createElement("p", `${hosting.vcpu} x vCPU`, null, null, vcpu_block);
      slide_container.appendChild(vcpu_block);
    }

    const ram_block = createElement("div", null, [ "slide_block", "ram_block" ]);
    if (ram_block) {
      const ram = hosting.ram < 1048576 ? `${hosting.ram / 1024} ГБ` : `${hosting.ram / 1048576} ТБ`;
      createElement("img", null, null, { "src": "/media/icons/ram.svg" }, ram_block);
      createElement("p", "Оперативная память", null, null, ram_block);
      createElement("p", `${ram}`, null, null, ram_block);
      slide_container.appendChild(ram_block);
    }

    const space_block = createElement("div", null, [ "slide_block", "space_block" ]);
    if (space_block) {
      const space = hosting.space < 1048576 ? `${hosting.space / 1024} ГБ` : `${hosting.space / 1048576} ТБ`;
      createElement("img", null, null, { "src": "/media/icons/space.svg" }, space_block);
      createElement("p", "Объём диска", null, null, space_block);
      createElement("p", `${space}`, null, null, space_block);
      slide_container.appendChild(space_block);
    }

    const traffic_block = createElement("div", null, [ "slide_block", "traffic_block" ]);
    if (traffic_block) {
      createElement("img", null, null, { "src": "/media/icons/traffic.svg" }, traffic_block);
      createElement("p", "Ежемесячный трафик", null, null, traffic_block);
      createElement("p", `${hosting.traffic} ГБ, далее - ограничение скорости до 10 Мбит/с`, null, null, traffic_block);
      slide_container.appendChild(traffic_block);
    }

    const request_block = createElement("div", null, [ "slide_block", "request_block" ]);
    if (request_block) {
      createElement("button", "Арендовать", null, { "onclick": `window.location.href = "/request?id=${hosting.id}"` }, request_block);
      slide_container.appendChild(request_block);
    }

    return slide_container;
  }

  return undefined;
}

function addSliderListeners(): void {
  const slider_buttons: NodeListOf<HTMLButtonElement> | null = document.querySelectorAll("#page_3 .slider_controls button");
  if (slider_buttons) {
    const slider: HTMLElement | null = document.querySelector("#page_3 .slider_container");

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
    }
  }
}

function changeSlide(slider: HTMLElement, direction: "prev" | "next"): void {
  const scroll_amount = slider.clientWidth;
  slider.scrollBy({ left: direction === "next" ? scroll_amount : -scroll_amount });
}

document.addEventListener("DOMContentLoaded", main);
