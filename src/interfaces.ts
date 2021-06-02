
export interface IMessage {
  senderId: string;
  senderName: string;
  key?: string;
  text: string;
  date: Date;
}

export interface IRole {
  id: string;
  name: string;
  team: Team;
  description: string;
}

export interface IPlayerState {
  role: IRole;
  alive: boolean;
  hasAmulate: boolean;
}

export type Team = "werewolf" | "villager" | "vampire" | undefined;