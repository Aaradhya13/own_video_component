export interface Attendee {
  id: string;
  email: string;
  isHost: boolean;
  isMuted: boolean;
  isBlocked: boolean;
}

export interface Message {
  sender: string;
  message: string;
  timestamp?: string;
}

export interface RoomData {
  id: string;
  hostEmail: string;
  allowedAttendees: string[];
}