import { changeHeaderColorOnScroll } from "./modules/ui.js";

function main(): void {
  changeHeaderColorOnScroll();
  const tooltipped_block = document.querySelector("#not_found .tooltipped");
  if (tooltipped_block) {
    tooltipped_block.addEventListener("click", pasteImageWithTooltip);
    pasteImageWithTooltip();
  } else {
    console.log("Tooltipped block not found, Touhou legacy was erased. Erased, but not forgotten!");
  }
}

function pasteImageWithTooltip(): void {
  const not_found_img = document.querySelector("#not_found img");

  if (not_found_img) {
    const sources = [
      "/media/img/Th08Alice.webp",
      "/media/img/Th08Eirin.webp",
      "/media/img/Th08Kaguya.webp",
      "/media/img/Th08Keine1.webp",
      "/media/img/Th08Keine2.webp",
      "/media/img/Th08Marisa.webp",
      "/media/img/Th08Mokou.webp",
      "/media/img/Th08Mystia.webp",
      "/media/img/Th08Nightbug.webp",
      "/media/img/Th08Reimu.webp",
      "/media/img/Th08Reisen.webp",
      "/media/img/Th08Remilia.webp",
      "/media/img/Th08Sakuya.webp",
      "/media/img/Th08Tewi.webp",
      "/media/img/Th08Youmu.webp",
      "/media/img/Th08Yukari.webp",
      "/media/img/Th08Yuyuko.webp",
    ];

    const alts = [
      "Алиса Маргатройд",
      "Эйрин Ягокоро",
      "Кагуя Хорайсан",
      "Кейна Камисирасава (человек)",
      "Кейна Камисирасава (хакутаку)",
      "Мариса Кирисаме",
      "Фудзивара-но Моко",
      "Мистия Лорелей",
      "Риггл Найтбаг",
      "Рейму Хакурей",
      "Рейсен Удонгейн Инаба",
      "Ремилия Скарлет",
      "Сакуя Идзаёи",
      "Теви Инаба",
      "Ёму Компаку",
      "Юкари Якумо",
      "Ююко Сайгёдзи",
    ];

    const index = Math.floor(Math.random() * sources.length);

    if (sources[index] && alts[index]) {
      not_found_img.setAttribute("src", sources[index]);
      not_found_img.setAttribute("alt", alts[index]);

      const tooltip = document.querySelector("#not_found .tooltip");
      if (tooltip) {
        tooltip.textContent = alts[index] + " из Touhou 8 ~ Imperishable Night";
      }
    }

  } else {
    console.error("Not found image not found (lol)");
  }
}

document.addEventListener("DOMContentLoaded", main);
