import { fetchAPIResponse } from "./modules/api.js";
import { displayMessage, createElement } from "./modules/utils.js";
import type { Server } from "./types/servers.js";

async function main(): Promise<void> {
  var servers = await getServers();
  if (servers) {
    const container = document.querySelector("#slider .slider_container");
    if (container) {
      for (const server of servers) {
        const slide = makeSlide(server);
        if (slide) {
          container.appendChild(slide);
        } else {
          console.error("Error creating slide for server", server);
        }
      }
    } else {
      console.error("slider_container not found");
    }
  } else {
    console.error("Error getting servers");
  }
}

function convertServers(response: Record<string, any>): Array<Server> {
  var output: Array<Server> = [];

  for (const [, server] of Object.entries(response)) {
    output.push({
      id: server.server_id,
      name: server.server_name,
      cpu: {
        name: server.cpu_name,
        cores: server.cpu_cores,
        threads: server.cpu_threads,
        frequency: server.cpu_frequency,
      },
      ram: server.server_ram,
      space: server.server_space,
    });
  }

  return output;
}

async function getServers(): Promise<Array<Server> | undefined> {
  const servers_response = await fetchAPIResponse("/api/servers");

  if (servers_response.status === "error") {
    displayMessage("Ошибка при обращении к серверу");
    console.log(servers_response.message);
    return undefined;
  }

  if (servers_response.data) {
    const converted: Array<Server> | null = convertServers(servers_response.data);
    if (converted) {
      return converted;
    }
  }
}

function makeSlide(server: Server): HTMLElement | undefined {
  const slide_container = createElement("div", null, ["slide"], { "id": server.id.toString() });

  if (slide_container) {
    createElement("h3", server.name, null, null, slide_container);

    const cpu_block = createElement("div", null, [ "slide_block", "cpu_block" ]);
    if (cpu_block) {
      createElement("img", null, null, { "src": "/media/img/Th08Kaguya.webp" }, cpu_block);
      const text_block = createElement("div");
      if (text_block) {
        createElement("p", "Процессор", null, null, text_block);
        createElement("span", server.cpu.name, null, null, text_block);
        createElement("span", `${server.cpu.cores} ядра / ${server.cpu.threads} потоков`, null, null, text_block);
        createElement("span", `Частота: ${server.cpu.frequency} МГц`, null, null, text_block);
        cpu_block.appendChild(text_block);
      }
      slide_container.appendChild(cpu_block);
    }

    const ram_block = createElement("div", null, ["slide_block", "ram_block"]);
    if (ram_block) {
      createElement("img", null, null, { "src": "/media/img/Th08Reisen.webp" }, ram_block);
      const text_block = createElement("div");
      if (text_block) {
        const ram = server.ram < 1048576 ? `${server.ram / 1024} ГБ` : `${server.ram / 1048576} ТБ`;
        createElement("p", `ОЗУ: ${ram}`, null, null, text_block);
        ram_block.appendChild(text_block);
      }
      slide_container.appendChild(ram_block);
    }

    const space_block = createElement("div", null, ["slide_block", "space_block"]);
    if (space_block) {
      createElement("img", null, null, { "src": "/media/img/Th08Mokou.webp" }, space_block);
      const text_block = createElement("div");
      if (text_block) {
        const space = server.space < 1048576 ? `${server.space / 1024} ГБ` : `${server.space / 1048576} ТБ`;
        createElement("p", `Диск: ${space}`, null, null, text_block);
        space_block.appendChild(text_block);
      }
      slide_container.appendChild(space_block);
    }

    return slide_container;
  }

  return undefined;
}

document.addEventListener("DOMContentLoaded", main);
