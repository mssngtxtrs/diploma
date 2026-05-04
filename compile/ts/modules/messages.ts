import { fetchAPIResponse } from "./api.js";
import { displayMessage } from "./utils.js";
import type { MessageClass } from "./utils.js";

type Message = {
  text: string;
  type: MessageClass;
}

async function getMessagesFromServer(): Promise<Array<Message> | void> {
  const response = await fetchAPIResponse("/api/messages");

  if (response) {
    if (response.status === "success" && response.data) {
      const messages: Array<Message> = [];

      for (const message of Object.entries(response.data)) {
        messages.push({
          text: message[1].message,
          type: message[1].type
        });
      }

      return messages;
    }
  }

  return;
}

export async function displayMessagesFromServer(): Promise<void> {
  const messages = await getMessagesFromServer();
  if (messages) {
    for (const message of messages) {
      displayMessage(message.text, message.type);
    }
  }
}
