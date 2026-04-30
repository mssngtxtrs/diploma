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

    const cpu_block = createElement("div", null, ["cpu_block"]);
    if (cpu_block) {
      createElement("p", "Процессор", null, null, cpu_block);
      createElement("span", server.cpu.name, null, null, cpu_block);
      createElement("span", `${server.cpu.cores} ядра / ${server.cpu.threads} потоков`, null, null, cpu_block);
      createElement("span", `Частота: ${server.cpu.frequency}`, null, null, cpu_block);
      slide_container.appendChild(cpu_block);
    }

    createElement("p", `ОЗУ: ${server.ram} ГБ`, null, null, slide_container);
    createElement("p", `Диск: ${server.space} ГБ`, null, null, slide_container);

    return slide_container;
  }

  return undefined;
}

document.addEventListener("DOMContentLoaded", main);
