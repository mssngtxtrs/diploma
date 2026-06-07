import { changeHeaderColorOnScroll, changeHeaderAuthButtons, burgerButtonListenerSetup, changeButtonState } from "./modules/ui.js";
import { displayMessagesFromServer } from "./modules/messages.js";
import { displayMessage } from "./modules/utils.js";
import { fetchAPIResponse } from "./modules/api.js";

type FormType = "code" | "recover";
var FORM_TYPE: FormType;

function main(): void {
  changeHeaderColorOnScroll();
  changeHeaderAuthButtons();
  displayMessagesFromServer();
  burgerButtonListenerSetup();

  switch (window.location.pathname) {
    case "/recover":
      FORM_TYPE = "recover";
      break;

    case "/code":
    default:
      FORM_TYPE = "code";
      break;
  }

  setupListeners();
}

function setupListeners() {
  const inputs = document.querySelectorAll<HTMLInputElement>(`#${FORM_TYPE} form input`);
  if (!inputs) return;

  inputs.forEach((input) => {
    input.addEventListener("input", () => displayError(input));

    if (FORM_TYPE === "recover") {
      if (input.name === "password" || input.name === "password_confirm") {
        input.addEventListener("input", () => comparePasswords());
      }
    }
  });

  const form = document.querySelector<HTMLFormElement>(`#${FORM_TYPE} form`);
  if (!form) return;
  if (FORM_TYPE === "code") form.addEventListener("submit", fetchCode);
  if (FORM_TYPE === "recover") form.addEventListener("submit", fetchPassword);
}

function displayError(input: HTMLInputElement): void {
  const error_span: Element | null = input.nextElementSibling;
  if (error_span) {
    if (!input.validity.valid) {
      error_span.textContent = input.getAttribute('title') || "Ошибка валидации";
    } else {
      error_span.textContent = "";
    }
  } else {
    console.error("Error span not found");
  }
}

function comparePasswords(): void {
  const pwd: HTMLInputElement | null = document.querySelector(`#${FORM_TYPE} #password`);
  const pwd_confirm: HTMLInputElement | null = document.querySelector(`#${FORM_TYPE} #password_confirm`);

  if (pwd && pwd_confirm) {
    if (pwd.value !== pwd_confirm.value) {
      pwd_confirm.setCustomValidity("Пароли не совпадают");
      displayError(pwd_confirm);
    } else {
      pwd_confirm.setCustomValidity("");
      displayError(pwd_confirm);
    }
  } else {
    console.error("Password fields not found");
  }
}

async function fetchCode(e: SubmitEvent): Promise<void> {
  e.preventDefault();

  const form = e.currentTarget as HTMLFormElement;
  if (!form) return;

  const email = form.querySelector<HTMLInputElement>("input[type='email']");
  if (!email) return;

  const submit_button = form.querySelector<HTMLButtonElement>("button[type='submit']");
  if (!submit_button) return;

  changeButtonState(submit_button);

  const payload = { email: email.value };

  const response = await fetchAPIResponse<Record<string, any>>("/api/auth/code", payload);
  if (!response) return;

  if (response.status === "error" || !response.data) {
    displayMessage(response.message ?? "Неизвестная ошибка", "error");
    changeButtonState(submit_button);
    return;
  }

  displayMessage("Ссылка на страницу смены пароля отправлена Вам на почту!");

  changeButtonState(submit_button);
}

async function fetchPassword(e: SubmitEvent) {
  e.preventDefault();

  const form = e.currentTarget as HTMLFormElement;
  if (!form) return;

  const submit_button = form.querySelector<HTMLButtonElement>("button[type='submit']");
  if (!submit_button) return;

  changeButtonState(submit_button);

  const password = form.querySelector<HTMLInputElement>("#password");
  const password_confirm = form.querySelector<HTMLInputElement>("#password_confirm");
  if (!password || !password_confirm) return;

  if (password.value !== password_confirm.value) {
    displayMessage("Пароли не совпадают", "error");
    changeButtonState(submit_button);
    return;
  }

  const url_params = new URLSearchParams(window.location.search);
  const token = url_params.get("token");

  if (!token) {
    displayMessage("Токен отсутствует", "error");
    changeButtonState(submit_button);
    return;
  }

  const payload = {
    token: token,
    new_password: password.value,
    new_password_confirm: password_confirm.value
  };
  const response = await fetchAPIResponse<Record<string, boolean>>("/api/auth/recover", payload);

  if (response.status === "error" || !response.data) {
    displayMessage(response.message ?? "Неизвестная ошибка", "error");
    changeButtonState(submit_button);
    return;
  }

  window.location.href = "/auth";
}

document.addEventListener("DOMContentLoaded", main);
