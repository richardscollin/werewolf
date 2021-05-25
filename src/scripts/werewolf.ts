import { rolesData } from "./roles.js";
type Team = "werewolf" | "villager" | undefined;

class Role {
  constructor(
    public id: string,
    public name: string,
    public team: Team,
    public description: string
  ) {}

  /*
  Returns true iff a werewolf. Will return false for characters
  on the werewolf team that are not considered werewolves by the seer
  */
  isWerewolf(): boolean {
    return this.id.includes("wolf");
  }
}

const roles = new Map(rolesData.map((o) => [o.id, o as Role]));
export { Team, Role, roles };
