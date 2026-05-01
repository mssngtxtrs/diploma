import { changeHeaderColorOnScroll } from "./modules/ui.js";

function main(): void {
  changeHeaderColorOnScroll();
  listenersSetup();
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

document.addEventListener("DOMContentLoaded", main);
