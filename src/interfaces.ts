export interface IVerb {
  present: string;
  past: string;
}

export interface IMessage {
  senderId: string;
  senderName: string;
  key?: string;
  text: string;
  date: Date;
}

export interface IDayResult {
  success: boolean;
  message: string;
  newDead?: string[];
  waitList?: string[];
}

export interface IPointResult {
  success: boolean;
  message: string;
  pointer?: IPlayerState;
  pointie?: IPlayerState;
}

export interface IRole {
  id: string;
  name: string;
  team: Team;
  description: string;
  verb?: IVerb;
  nightlyAction?: boolean;
  firstNightAction?: boolean;
}

export interface IPlayerState {
  role: IRole;
  alive: boolean;
  hasAmulate: boolean;

  // extra data that is role dependent
  angelProtected?: string; // the angel playerId if protected
  dopplegangedPlayer?: string; // the
  cupidLover?: string; // the lovers playerId
  bodyguardProtected?: boolean;
  whoreSleepover?: string;
  spellcasterSilenced?: boolean;
  oldhagCastAway?: boolean;
}

export type Team = "werewolf" | "villager" | "vampire" | undefined;
