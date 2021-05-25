export interface IMessage {
  senderId: string;
  senderName: string;
  key?: string;
  text: string;
  date: Date;
}

export interface IPlayerState {
  role: Role;
  alive: boolean;
  hasAmulate: boolean;
}
