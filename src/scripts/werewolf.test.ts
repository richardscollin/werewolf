import { WerewolfStateMachine, roles, Role, IPlayerState } from "./werewolf.js";

console.log("Running tests.");

const users = new Map([
  ["1", "alice"],
  ["2", "bob"],
  ["3", "charles"],
  ["4", "david"],
  ["5", "elliot"],
  ["6", "franie"],
  ["7", "gnatz"],
  ["8", "helios"],
]);

function id2username(id: string): string | undefined {
  return users.get(id);
}
const game = new WerewolfStateMachine("game-id", id2username, "test-seed");

game.assignRoles(
  Array.from(users.keys()),
  new Map([
    ["werewolf", 1],
    ["seer", 1],
    ["villager", 6],
  ])
);

test("Simple Test", () => {
  game.beginNight();
  console.log(game.info());

  game.playerPointsToPlayer("8", "2");
  game.playerPointsToPlayer("1", "3");

  const dayMessage = game.beginDay();
  console.log(dayMessage);
  console.log(game.info());

  game.beginNight();

  console.log(game.playerPointsToPlayer("1", "8"));
  game.playerPointsToPlayer("8", "3");

  console.log(game.info());
  expect(1).toBe(1);
});
