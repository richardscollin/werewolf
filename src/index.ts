import * as mediasoupClient from "mediasoup-client";
import { AppChat } from "./components/app-chat";
import { AppPlayingCard } from "./components/app-playing-card";
import { IMessage } from "./interfaces.js";
import { WerewolfClient } from "./scripts/werewolf-client";
import { $ } from "./scripts/utils";

function addKeybindings() {
  document.addEventListener("keydown", (event) => {
    const keyName = event.key;
    if (keyName === "Escape") {
      $(".modal")?.classList.add("hidden");
    }
  });
}

window.addEventListener("load", () => {
  addKeybindings();
  const client = new WerewolfClient();
  client.connect();

  const chatElement = $("app-chat") as AppChat;
  chatElement.onmessage = client.onMessage.bind(client);

  client.receiveChat = (msg: IMessage) => {
    chatElement.appendMessage(msg);
  };
  client.welcome();

  const playingCard = $("#your-role-card") as AppPlayingCard;

  client.onGameStateChange = () => {
    // TODO also update if role is undefined
    console.log(client.role);
    if (client.role) {
      console.log("setting role attribute");
      playingCard.dataset.icon = client.role.id;
      playingCard.dataset.description = client.role.description;
    }
  };

  const device = new mediasoupClient.Device();
  console.log(device);
});
