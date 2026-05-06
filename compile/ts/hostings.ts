import { changeHeaderColorOnScroll, changeHeaderAuthButtons, burgerButtonListenerSetup } from "./modules/ui.js";
import { displayMessagesFromServer } from "./modules/messages.js";
import type { HostingFull } from "./types/hostings.js";
import { fetchAPIResponse } from "./modules/api.js";
import { displayMessage, createElement } from "./modules/utils.js";

async function main(): Promise<void> {
  displayMessagesFromServer();
  changeHeaderColorOnScroll();
  changeHeaderAuthButtons();
  burgerButtonListenerSetup();

  var hostings = await getHostings();
  if (hostings) {
    const container = document.querySelector("#hostings .hostings_container");
    if (container) {
      for (const hosting of hostings) {
        const block = makeBlock(hosting);
        if (block) {
          container.appendChild(block);
        } else {
          console.error("Error creating block for hosting", hosting)
        }
      }
    } else {
      console.error("hostings_container not found");
    }
  } else {
    displayMessage("Ошибка при получении данных с сервера");
    console.error("Error getting hostings info");
  }
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
      return converted;
    }
  }
}

function makeBlock(hosting: HostingFull): HTMLElement | undefined {
  const block = createElement("div", null, ["hosting"], { "id": hosting.id.toString() });

  if (block) {
    createElement("h3", hosting.name, null, null, block);

    const price_block = createElement("div", null, [ "hosting_block", "price_block" ]);
    if (price_block) {
      createElement("p", `${hosting.price_per_month}₽/мес.`, null, null, price_block);
      block.appendChild(price_block);
    }

    const vcpu_block = createElement("div", null, [ "hosting_block", "vcpu_block" ]);
    if (vcpu_block) {
      createElement("img", null, null, { "src": "/media/icons/vcpu.svg", "alt": "vCPU" }, vcpu_block);
      createElement("p", "Процессор", null, null, vcpu_block);
      createElement("p", `${hosting.vcpu} x vCPU`, null, null, vcpu_block);
      block.appendChild(vcpu_block);
    }

    const ram_block = createElement("div", null, [ "hosting_block", "ram_block" ]);
    if (ram_block) {
      const ram = hosting.ram < 1048576 ? `${hosting.ram / 1024} ГБ` : `${hosting.ram / 1048576} ТБ`;
      createElement("img", null, null, { "src": "/media/icons/ram.svg", "alt": "ОЗУ" }, ram_block);
      createElement("p", "Оперативная память", null, null, ram_block);
      createElement("p", `${ram}`, null, null, ram_block);
      block.appendChild(ram_block);
    }

    const space_block = createElement("div", null, [ "hosting_block", "space_block" ]);
    if (space_block) {
      const space = hosting.space < 1048576 ? `${hosting.space / 1024} ГБ` : `${hosting.space / 1048576} ТБ`;
      createElement("img", null, null, { "src": "/media/icons/space.svg", "alt": "Объём диска" }, space_block);
      createElement("p", "Объём диска", null, null, space_block);
      createElement("p", `${space}`, null, null, space_block);
      block.appendChild(space_block);
    }

    const traffic_block = createElement("div", null, [ "hosting_block", "traffic_block" ]);
    if (traffic_block) {
      createElement("img", null, null, { "src": "/media/icons/traffic.svg", "alt": "Трафик" }, traffic_block);
      createElement("p", "Ежемесячный трафик", null, null, traffic_block);
      createElement("p", `${hosting.traffic} ГБ, далее - ограничение скорости до 10 Мбит/с`, null, null, traffic_block);
      block.appendChild(traffic_block);
    }

    const server_block = createElement("div", null, ["hosting_block", "server_block"]);
    if (server_block) {
      createElement("img", null, null, { "src": "/media/icons/server.svg", "alt": "Сервер" }, server_block);
      createElement("p", "Сервер", null, null, server_block);
      createElement("p", `${hosting.server.name}`, null, null, server_block);
      block.appendChild(server_block);
    }

    const cpu_block = createElement("div", null, ["hosting_block", "cpu_block"]);
    if (cpu_block) {
      createElement("p", "Процессор", null, null, cpu_block);
      createElement("p", `${hosting.server.cpu.name}`, null, null, cpu_block);
      createElement("p", `Ядра: ${hosting.server.cpu.cores}, потоки: ${hosting.server.cpu.threads}`, null, null, cpu_block);
      createElement("p", `Частота: ${hosting.server.cpu.frequency} МГц`, null, null, cpu_block);
      block.appendChild(cpu_block);
    }

    const request_block = createElement("div", null, [ "hosting_block", "request_block" ]);
    if (request_block) {
      createElement("button", "Арендовать", null, { "onclick": `window.location.href = "/request?id=${hosting.id}"` }, request_block);
      block.appendChild(request_block);
    }

    return block;
  }

  return undefined;
}

document.addEventListener("DOMContentLoaded", main);
