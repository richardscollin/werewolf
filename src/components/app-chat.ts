import { IMessage } from "../interfaces";
import { html } from "../scripts/utils";

export class AppChat extends HTMLElement {
  onmessage: any = null;

  appendMessage(msg: IMessage) {
    // find html escaping template library
    const chatMessage = document.createElement("div");
    chatMessage.classList.add("chat-message");
    if (msg.senderId === localStorage.getItem("clientId")) {
      chatMessage.classList.add("own-message");
    }

    const sentBy = document.createElement("span");
    sentBy.classList.add("sent-by");
    sentBy.innerText = msg.senderName;
    sentBy.setAttribute("title", msg.date.toString());

    const messageText = document.createElement("span");
    messageText.classList.add("message-text");

    messageText.innerText = msg.text;

    chatMessage.appendChild(sentBy);
    chatMessage.appendChild(messageText);

    const chatLog = this.shadowRoot!.querySelector("#chat-log")!;
    chatLog.appendChild(chatMessage);

    chatLog.scrollTop = chatLog.scrollHeight;
  }
  constructor() {
    super();
    let t = document.createElement("template");
    t.innerHTML = html`<style>
        #root {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 0 16px;
          border: 1px solid #efefef;
          width: 100%;
          max-width: 540px;
          box-sizing: border-box;
        }
        form {
          align-self: flex-end;
          justify-content: flex-end;
          display: flex;
          width: 100%;
        }
        #a {
          appearance: none;
          border: none;
          background-color: #e5e5e5;
          display: inline-block;
          padding: 0.5em 1em;
          border-top-left-radius: 4px;
          border-bottom-left-radius: 4px;
          flex: 1 1 5em;
          width: 100%;
        }
        #b {
          --hue: 200;
          display: inline;
          background-color: hsl(var(--hue), 40%, 60%);
          padding: 0.5em 1em;
          color: hsl(var(--hue), 80%, 15%);
          font-weight: bold;
          border: none;
          border-top-right-radius: 4px;
          border-bottom-right-radius: 4px;
          text-transform: uppercase;
        }
        #chat-log {
          display: flex;
          flex-direction: column;
          align-content: stretch;

          height: 300px;
          overflow-y: auto;
          margin-bottom: 16px;
        }
        .chat-message {
          font-size: 1.3rem;
          padding-bottom: 1em;
          width: 100%;
          overflow-wrap: break-word;
        }
        .chat-message:first-child {
          margin-top: auto;
        }

        .message-text {
          line-height: 1.2em;
        }
        .own-message {
          color: red;
        }

        .sent-by {
          font-weight: bold;
        }
        .sent-by::after {
          content: ":";
          margin-right: 0.5em;
        }
      </style>
      <div id="root">
        <div id="chat-log"></div>
        <form>
          <input id="a" placeholder="Send a message" autocomplete="off" /><input
            id="b"
            type="submit"
            value="Send"
          />
        </form>
      </div>`;
    this.attachShadow({ mode: "open" }).appendChild(t.content.cloneNode(true));
    const form: HTMLFormElement = this.shadowRoot!.querySelector("form")!;
    form.addEventListener("submit", this.onSubmit.bind(this));
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    const messageInput: HTMLInputElement =
      this.shadowRoot!.querySelector("#a")!;

    if (this.onmessage) {
      this.onmessage(messageInput.value);
      messageInput.value = "";
    }
  }
}
