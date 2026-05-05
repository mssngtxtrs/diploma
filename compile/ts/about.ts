import { changeHeaderColorOnScroll } from "./modules/ui.js";
import { displayMessagesFromServer } from "./modules/messages.js";

function main(): void {
  displayMessagesFromServer();
  changeHeaderColorOnScroll();
}

document.addEventListener("DOMContentLoaded", main);
