export function changeHeaderColorOnScroll() {
  const header = document.querySelector("header");
  if (header) {
    window.addEventListener("scroll", () => {
      const header_height = header.offsetHeight;
      if (window.scrollY > header_height) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    });
  } else {
    console.error("Header not found");
  }
}
