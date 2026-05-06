import { changeHeaderColorOnScroll, changeHeaderAuthButtons, burgerButtonListenerSetup, changeButtonState } from "./modules/ui.js";
import { displayMessagesFromServer } from "./modules/messages.js";
import { displayMessage } from "./modules/utils.js";
import { fetchAPIResponse } from "./modules/api.js";

type FormType = "login" | "reg";

function main(): void {
  changeHeaderColorOnScroll();
  changeHeaderAuthButtons();
  displayMessagesFromServer();
  listenersSetup();
  burgerButtonListenerSetup();
}

function listenersSetup(): void {
  const pwd_confirm = document.querySelector("#reg #password_confirm");
  const pwd = document.querySelector("#reg #password");
  if (pwd_confirm && pwd) {
    pwd_confirm.addEventListener("input", comparePasswords);
    pwd.addEventListener("input", comparePasswords);
  }

  const auth_switcher_buttons: NodeListOf<HTMLButtonElement> = document.querySelectorAll(".auth_switcher button");
  const auth_forms: NodeListOf<HTMLFormElement> = document.querySelectorAll(".forms form");
  const auth_forms_inputs: NodeListOf<HTMLInputElement> = document.querySelectorAll("form input");

  if (auth_switcher_buttons && auth_forms) {
    auth_switcher_buttons.forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.target;

        if (id) {
          auth_forms.forEach(form => form.style.display = "none");
          const opening_form = document.getElementById(id);

          if (opening_form) {
            opening_form.style.display = "flex";
          } else {
            console.error("Opening form not found");
          }

          auth_switcher_buttons.forEach(btn => btn.classList.remove("opened"));
          button.classList.add("opened");
        } else {
          console.error("Form ID is not defined");
        }
      });
    });
  } else {
    console.error("Auth switcher buttons or forms not found");
  }

  if (auth_forms) {
    auth_forms.forEach(form => {
      switch (form.id) {
        case "reg":
          form.addEventListener("submit", (e) => sendRegData(e));
          break;
        case "login":
          form.addEventListener("submit", (e) => sendLoginData(e));
          break;
      }
    });
  } else {
    console.error("Auth forms not found");
  }

  if (auth_switcher_buttons[0]) {
    auth_switcher_buttons[0].click();
  }

  if (auth_forms_inputs) {
    auth_forms_inputs.forEach(input => {
      if (input.type !== "checkbox") {
        input.addEventListener("input", () => displayError(input));
      }
    });
  } else {
    console.error("Auth form inputs not found");
  }
}

function comparePasswords(): void {
  const pwd: HTMLInputElement | null = document.querySelector("#reg #password");
  const pwd_confirm: HTMLInputElement | null = document.querySelector("#password_confirm");

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

async function sendRegData(e: SubmitEvent): Promise<void> {
  var error: string = "Неизвестная ошибка";
  var submit_button: HTMLButtonElement | null = null;
  if (e) {
    e.preventDefault();

    const form: HTMLFormElement | null = e.target as HTMLFormElement | null;

    if (form) {
      submit_button = form.querySelector("button[type='submit']");

      if (submit_button) {
        changeButtonState(submit_button);
      }

      const form_data: FormData = new FormData(form);
      var payload: Record<string, string> = convertToPayload(form_data);

      const response = await fetchAPIResponse("/api/auth/register", payload);

      if (response.status === "error") {
        error = response.message || "Неизвестная ошибка";
      }

      if (response.data === true) {
        const form_buttons: NodeListOf<HTMLButtonElement> | null = document.querySelectorAll(".auth_switcher button");

        if (form_buttons) {
          changeForm("login", form_buttons);
          displayMessage("Успешная регистрация! Теперь вы можете войти в систему.");
          return;
        }
      } else {
        console.log(response.message);
        error = response.message as string;
      }
    } else {
      console.error("Error getting form data");
    }
  } else {
    console.error("Event of registration form was not passed");
  }

  displayMessage(`${error}`, "error");

  if (submit_button) {
    changeButtonState(submit_button);
  }
}

async function sendLoginData(e: SubmitEvent): Promise<void> {
  var error: string = "Неизвестная ошибка";
  var submit_button: HTMLButtonElement | null = null;
  if (e) {
    e.preventDefault();

    const form: HTMLFormElement | null = e.target as HTMLFormElement | null;

    if (form) {
      submit_button = form.querySelector("button[type='submit']");

      if (submit_button) {
        changeButtonState(submit_button);
      }

      const form_data: FormData = new FormData(form);
      var payload: Record<string, string> = convertToPayload(form_data);

      const response = await fetchAPIResponse("/api/auth/log-in", payload);

      if (response.status === "error") {
        error = response.message || "Неизвестная ошибка";
      }

      if (response.data === true) {
        const get_query = window.location.search;
        if (get_query) {
          window.location.href = "/request" + get_query;
        } else {
          window.location.href = "/dashboard";
        }
        return;
      } else {
        error = response.message as string;
      }
    } else {
      console.error("Error getting form data");
    }
  } else {
    console.error("Event of registration form was not passed");
  }

  displayMessage(`${error}`, "error");

  if (submit_button) {
    changeButtonState(submit_button);
  }
}

function convertToPayload(form_data: FormData): Record<string, string> {
  var output: Record<string, any> = {};
  form_data.forEach(function (value: FormDataEntryValue, key: string) {
    var result_value: string | boolean = value as string;
    if (key === "consent") {
      result_value = value as string === "on" ? true : false;
    }
    output[key] = result_value;
  });
  return output;
}

function changeForm(type: FormType, buttons: NodeListOf<HTMLButtonElement>): void {
  buttons.forEach(button => {
    if (button.dataset.target === type) {
      button.click();
    }
  });
}

document.addEventListener("DOMContentLoaded", main);
