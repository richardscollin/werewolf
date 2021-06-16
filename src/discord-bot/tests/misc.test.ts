/* Misc tests for the discord bot */
import { existsSync } from "fs";
import { Role, roles } from "../../scripts/role.js";

/* Test all of the roles have a corresponding image file */
test("test role icons exist", () => {
  console.log(process.cwd());
  roles.forEach((role: Role) => {
    if (!existsSync(`public/svg/images/werewolf-icons_${role.id}.png`)) {
      expect("missing").toBe(role.id);
    }
  });
});
