function main(): void {
  const not_found_img = document.querySelector("#not_found img");

  if (not_found_img) {
    const sources = [
       "/media/img/Th08Alice.webp",
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
      "Alice",
      "Kaguya",
      "Keine (human)",
      "Keine (hakutaku)",
      "Marisa",
      "Mokou",
      "Mystia",
      "Nightbug",
      "Reimu",
      "Reisen",
      "Remilia",
      "Sakuya",
      "Tewi",
      "Youmu",
      "Yukari",
      "Yuyuko",
    ];

    const index = Math.floor(Math.random() * sources.length);

    if (sources[index] && alts[index]) {
      not_found_img.setAttribute("src", sources[index]);
      not_found_img.setAttribute("alt", alts[index]);
    }

  } else {
    console.error("Not found image not found (lol)");
  }
}

document.addEventListener("DOMContentLoaded", main);
