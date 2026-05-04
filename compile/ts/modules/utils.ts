export type MessageClass = "std" | "error" | "debug";

export function displayMessage(message: string, message_class: MessageClass = "std") {
  const message_box: HTMLElement | null = document.querySelector(".messages");

  if (!message_box) {
    console.error("Message box element not found! Casting to logs...");
    console.log(message);
    return;
  }
  const message_element = createElement("div", null, [ "message", message_class ]);
  if (message_element) {
    createElement("p", message, null, null, message_element);
    createElement("button", "×", [ "close" ], { "onclick": "this.parentElement.remove()" }, message_element);
    message_box.appendChild(message_element);
  }
}

export function createElement(tag: string, text_content: string | null = null, classes: string[] | null = null, props: Record<string, string> | null = null, append_to: HTMLElement | null = null): HTMLElement | void {
  const element: HTMLElement = document.createElement(tag);

  if (text_content) {
    element.textContent = text_content;
  }

  if (classes) {
    element.classList.add(...classes);
  }

  if (props) {
    for (const [key, value] of Object.entries(props)) {
      element.setAttribute(key, value);
    }
  }

  if (!append_to) {
    return element;
  } else {
    append_to.appendChild(element);
    return;
  }
}
