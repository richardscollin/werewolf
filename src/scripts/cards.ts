import { roles } from "./role.js";

const grid = document.querySelector(".grid") as HTMLDivElement;
for (let role of roles.values()) {
  const { id, name, team, description } = role;
  const playingCard = document.createElement("app-playing-card");

  playingCard.setAttribute("data-name", name);
  if (team)
    playingCard.setAttribute("data-team", team);
  playingCard.setAttribute("data-description", description);
  playingCard.setAttribute("data-icon", id);

  grid.appendChild(playingCard);
}
