import { changeHeaderColorOnScroll, changeHeaderAuthButtons } from "./modules/ui.js";
import { displayMessagesFromServer } from "./modules/messages.js";

function main(): void {
  displayMessagesFromServer();
  changeHeaderColorOnScroll();
  changeHeaderAuthButtons();
}

document.addEventListener("DOMContentLoaded", main);
