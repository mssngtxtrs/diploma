import { changeHeaderColorOnScroll, changeHeaderAuthButtons, burgerButtonListenerSetup } from "./modules/ui.js";
import { displayMessagesFromServer } from "./modules/messages.js";

function main(): void {
  displayMessagesFromServer();
  changeHeaderColorOnScroll();
  changeHeaderAuthButtons();
  burgerButtonListenerSetup();
}

document.addEventListener("DOMContentLoaded", main);
