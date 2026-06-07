import { changeHeaderColorOnScroll, changeHeaderAuthButtons, burgerButtonListenerSetup, highlightActiveLink } from "./modules/ui.js";
import { displayMessagesFromServer } from "./modules/messages.js";
import { displayMessage, createElement } from "./modules/utils.js";
import { fetchAPIResponse } from "./modules/api.js";
import type { APIResponse } from "./modules/api.js";

var USERS: Array<Record<string, any>> = [];
var SHOWN_ENTRIES: number = 6;
var TOTAL_PAGES: number = 0;
var DIALOG_OPENED: boolean = false;
var USERS_TOTAL: number = 0;

async function main(): Promise<void> {
  displayMessagesFromServer();
  changeHeaderColorOnScroll();
  changeHeaderAuthButtons();
  burgerButtonListenerSetup();
  highlightActiveLink("users");

  await getUsersWrap();
}

async function getUsersWrap(): Promise<void> {
  await getUsers().then((users) => {
    if (users) {
      USERS = users.sort((a, b) => b.user_id - a.user_id);
      TOTAL_PAGES = Math.ceil(USERS.length / SHOWN_ENTRIES);
      fillPagination();
      fillUsers();
    } else {
      createPlaceholderForUsers();
    }
  });
}

async function getUsers(): Promise<Array<Record<string, any>> | null> {
  var users: APIResponse<Array<Record<string, any>>> = await fetchAPIResponse("/api/admin/users");

  if (users.status === "success") {
    if (users.data) {
      return users.data;
    }
  } else {
    displayMessage(users.message ?? "Ошибка получения данных о пользователях", "error");
    console.error('Error fetching users:', users.message ?? "Unknown error");
  }
  return null;
}

function fillPagination(): void {
  const container: HTMLElement | null = document.querySelector("#users_header .pagination .pagination_container");
  if (container) {
    container.replaceChildren();
    countPagination();
    for (let i = 1; i <= TOTAL_PAGES; i++) {
      const button = createElement("button", i.toString(), null, { "id": `page_${i}` });
      if (button) {
        button.addEventListener("click", () => {
          if (button.classList.contains("chosen") || DIALOG_OPENED) return;

          fillUsers(i);
          countPagination(i);
        });
        container.appendChild(button);
      }
    }
  }
}

function countPagination(requested_page: number = 1): void {
  const pagination_count = document.querySelector("#users_header .pagination .pagination_count");
  if (!pagination_count) return;

  if (pagination_count.classList.contains("skeleton")) pagination_count.classList.remove("skeleton");
  pagination_count.textContent = `${requested_page} / ${TOTAL_PAGES}`;
}

function highlightPaginationButton(requested_page: number): void {
  const container: HTMLElement | null = document.querySelector("#users_header .pagination");
  if (!container) return;

  const buttons = container.querySelectorAll("button");
  buttons.forEach((button) => {
    if (button.id === `page_${requested_page}`) {
      button.classList.add("chosen");
    } else {
      button.classList.remove("chosen");
    }
  });
}

function fillUsers(requested_page: number = 1): void {
  var shown_users: Array<Record<string, any>> = [];

  if (requested_page <= TOTAL_PAGES) {
    shown_users = USERS.slice((requested_page - 1) * SHOWN_ENTRIES, requested_page * SHOWN_ENTRIES)
    if (shown_users.length > 0) {
      const container: HTMLElement | null = document.querySelector("#users");
      if (container) {
        container.replaceChildren();
        shown_users.forEach((user: Record<string, any>) => {
          const user_element = createUserElement(user);
          if (!user_element) return;

          container.appendChild(user_element);
          highlightPaginationButton(requested_page);
        });
      } else {
        console.error("Requests container not found");
      }
    } else {
      createPlaceholderForUsers();
    }
  } else {
    createPlaceholderForUsers();
  }
}

function createUserElement(user: Record<string, any>): HTMLElement | null {
  const user_element = createElement("div", null, ["user"], { "id": `user_${user.user_id}` })
  if (!user_element) return null;

  const name_block = createElement("div", null, ["user_block", "name_block"]);
  if (name_block) {
    createElement("p", user.user_id, ['monospaced'], null, name_block);
    const second_name: string = user.second_name ? ` ${user.second_name}` : "";
    const name_string: string = user.last_name + " " + user.first_name + second_name;
    createElement("h3", name_string, null, null, name_block);
    createElement("p", user.login, ['monospaced'], null, name_block);
    user_element.appendChild(name_block);
  }

  const email_block = createElement("div", null, ['user_block', 'email_block']);
  if (email_block) {
    createElement("p", user.email, null, null, email_block);
    user_element.appendChild(email_block);
  }

  const level_block = createElement("div", null, ['user_block', 'level_block']);
  if (level_block) {
    createElement("p", user.level_name, null, null, level_block);
    user_element.appendChild(level_block);
  }

  const action_block = createElement("div", null, ['user_block', 'action_block']);
  if (action_block) {
    const changer_button = createElement<HTMLButtonElement>("button", "Изменить привелегии", null, { "style": `anchor-name: --changer-${user.user_id}` });
    if (!changer_button) return null;

    changer_button.addEventListener("click", (e) => {
      showPrivilegeDialog(e, user.user_id);
    });

    const password_button = createElement<HTMLButtonElement>("button", "Сменить пароль", null, { "style": `anchor-name: --password-${user.user_id}` });
    if (!password_button) return null;

    password_button.addEventListener("click", (e) => {
      showPasswordDialog(e, user.user_id);
    });

    const delete_button = createElement<HTMLButtonElement>("button", "Удалить", ['destructive'], { "style": `anchor-name: --delete-${user.user_id}` });
    if (!delete_button) return null;

    delete_button.addEventListener("click", (e) => {
      showDeleteDialog(e, user.user_id);
    });

    action_block.appendChild(changer_button);
    action_block.appendChild(password_button);
    action_block.appendChild(delete_button);
    user_element.appendChild(action_block);
  }

  return user_element;
}

function createPlaceholderForUsers(): void {
  const container = document.querySelector("#users");
  if (!container) return;

  container.replaceChildren();

  const placeholder = createElement<HTMLDivElement>("div", null, ['placeholder'])
  if (!placeholder) return;

  createElement("h2", "Нет пользователей", null, null, placeholder);
  createElement("p", "Попробуйте вернуться позже", null, null, placeholder);

  container.appendChild(placeholder);
}

function handleDialogClose(button: HTMLButtonElement, dialog: Element | null): void {
  button.classList.remove("opened");
  if (dialog) dialog.remove();
  DIALOG_OPENED = false;
}

function showPasswordDialog(e: MouseEvent, user_id: number): void {
  const button = e.currentTarget as HTMLButtonElement;

  if (button.classList.contains("opened")) {
    handleDialogClose(button, document.querySelector(".dialog"));
    return;
  }

  if (DIALOG_OPENED) {
    displayMessage("Завершите редактирование для переключения");
    return;
  }

  const dialog = createElement("div", null, ["dialog", "password_dialog"], { "style": `position-anchor: --password-${user_id}` });
  if (!dialog) return;

  const form = createElement<HTMLFormElement>("form");
  if (!form) return;

  createElement("h3", "Сменить пароль", null, null, form);

  // Поле ввода пароля
  const input_block_1 = createElement("div", null, ["input", "password_block"]);
  if (!input_block_1) return;
  createElement("label", "Новый пароль", null, { "for": "new_password" }, input_block_1);
  const input_1 = createElement<HTMLInputElement>("input", null, null, { "id": "new_password", "type": "password", "required": "true" }, input_block_1);

  form.appendChild(input_block_1);

  // Поле подтверждения пароля
  const input_block_2 = createElement("div", null, ["input", "password_confirm_block"]);
  if (!input_block_2) return;
  createElement("label", "Подтвердите пароль", null, { "for": "confirm_password" }, input_block_2);
  const input_2 = createElement<HTMLInputElement>("input", null, null, { "id": "confirm_password", "type": "password", "required": "true" }, input_block_2);

  form.appendChild(input_block_2);

  createElement("button", "Сохранить", ["accent"], { "type": "submit" }, form);

  const cancel_button = createElement("button", "Отмена", null, { "type": "button" });
  if (!cancel_button) return;

  cancel_button.addEventListener("click", () => {
    button.classList.remove('opened');
    dialog.remove();
    DIALOG_OPENED = false;
  });

  form.appendChild(cancel_button);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    if (!form) return;

    const input_1 = form.querySelector<HTMLInputElement>("#new_password");
    const input_2 = form.querySelector<HTMLInputElement>("#confirm_password");
    if (!input_1 || !input_2) return;

    if (input_1.value !== input_2.value) {
      displayMessage("Пароли не совпадают", "error");
      return;
    }

    if (await changeUserPassword(user_id, input_1.value)) {
      displayMessage("Пароль успешно изменен");
      handleDialogClose(button, dialog);
      getUsersWrap();
    } else {
      displayMessage("Ошибка при смене пароля", "error");
    }
  });

  dialog.appendChild(form);

  const user_container = document.querySelector(`#user_${user_id}`);
  if (!user_container) return;
  user_container.appendChild(dialog);
  button.classList.add("opened");
  DIALOG_OPENED = true;
}

function showPrivilegeDialog(e: MouseEvent, user_id: number): void {
  const button = e.currentTarget as HTMLButtonElement;

  if (button.classList.contains("opened")) {
    handleDialogClose(button, document.querySelector(".dialog"));
    return;
  }

  if (DIALOG_OPENED) {
    displayMessage("Завершите редактирование для переключения");
    return;
  }

  const dialog = createElement("div", null, ["dialog", "privilege_dialog"], { "style": `position-anchor: --changer-${user_id}` });
  if (!dialog) return;

  const form = createElement<HTMLFormElement>("form");
  if (!form) return;

  createElement("h3", "Изменить привилегии", null, null, form);

  const select_wrap = createElement("div", null, ["select_wrap"]);
  if (!select_wrap) return;

  const select = createElement<HTMLSelectElement>("select", null, null, { "name": "level_id", "id": "level_id", "required": "true" });
  if (!select) return;

  createElement("option", "Пользователь", null, { "value": "1" }, select);
  createElement("option", "Администратор", null, { "value": "2" }, select);

  select_wrap.appendChild(select);

  createElement("div", null, ["select_chevron"], null, select_wrap);

  form.appendChild(select_wrap);

  createElement("button", "Применить", ["accent"], { "type": "submit" }, form);

  const cancel_button = createElement("button", "Отмена", null, { "type": "button" });
  if (!cancel_button) return;

  cancel_button.addEventListener("click", () => {
    button.classList.remove('opened');
    dialog.remove();
    DIALOG_OPENED = false;
  });

  form.appendChild(cancel_button);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const level_id = parseInt(select.value);

    if (await changeUserPrivilege(user_id, level_id)) {
      displayMessage("Привилегии успешно изменены");
      handleDialogClose(button, dialog);
      getUsersWrap();
    } else {
      displayMessage("Ошибка при изменении привилегий", "error");
    }
  });

  dialog.appendChild(form);

  const user_container = document.querySelector(`#user_${user_id}`);
  if (!user_container) return;
  user_container.appendChild(dialog);
  button.classList.add("opened");
  DIALOG_OPENED = true;
}

function showDeleteDialog(e: MouseEvent, user_id: number): void {
  const button = e.currentTarget as HTMLButtonElement;

  if (button.classList.contains("opened")) {
    handleDialogClose(button, document.querySelector(".dialog"));
    return;
  }

  if (DIALOG_OPENED) {
    displayMessage("Завершите редактирование для переключения");
    return;
  }

  const dialog = createElement("div", null, ["dialog", "delete_dialog"], { "style": `position-anchor: --delete-${user_id}` });
  if (!dialog) return;

  const form = createElement<HTMLFormElement>("form");
  if (!form) return;

  createElement("h3", "Удалить пользователя", null, null, form);

  createElement("p", "Вы уверены, что хотите безвозвратно удалить эту учётную запись? Все заявки пользователя будут автоматически отменены.", null, null, form);
  createElement("button", "Подтвердить удаление", ["destructive"], { "type": "submit" }, form);

  const cancel_button = createElement("button", "Отмена", null, { "type": "button" });
  if (!cancel_button) return;

  cancel_button.addEventListener("click", () => {
    button.classList.remove('opened');
    dialog.remove();
    DIALOG_OPENED = false;
  });

  form.appendChild(cancel_button);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (await deleteUserAccount(user_id)) {
      displayMessage("Пользователь успешно удален");
      handleDialogClose(button, dialog);
      getUsersWrap();
    } else {
      displayMessage("Ошибка при удалении пользователя", "error");
    }
  });

  dialog.appendChild(form);

  const user_container = document.querySelector(`#user_${user_id}`);
  if (!user_container) return;
  user_container.appendChild(dialog);
  button.classList.add("opened");
  DIALOG_OPENED = true;
}

async function changeUserPassword(user_id: number, password: string): Promise<boolean> {
  const payload: Record<string, string> = {
    user_id: user_id.toString(),
    password: password
  };
  const response = await fetchAPIResponse("/api/admin/users/change_password", payload);
  return response.status === "success";
}

async function changeUserPrivilege(user_id: number, level_id: number): Promise<boolean> {
  const payload: Record<string, string> = {
    user_id: user_id.toString(),
    level_id: level_id.toString()
  };
  const response = await fetchAPIResponse("/api/admin/users/change_privilege", payload);
  return response.status === "success";
}

async function deleteUserAccount(user_id: number): Promise<boolean> {
  const payload: Record<string, string> = {
    user_id: user_id.toString()
  };
  const response = await fetchAPIResponse("/api/admin/users/delete", payload);
  return response.status === "success";
}

document.addEventListener("DOMContentLoaded", main);
