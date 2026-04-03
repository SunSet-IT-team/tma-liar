import { Schema, model } from 'mongoose';

/** Анонимные посетители (guest_*), не хранятся в коллекции User. */
export interface GuestPresence {
  guestId: string;
  nickname: string;
  lastActiveAt: Date;
}

const GuestPresenceSchema = new Schema<GuestPresence>(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    nickname: { type: String, required: true },
    lastActiveAt: { type: Date, required: true, index: true },
  },
  {
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

export const GuestPresenceModel = model<GuestPresence>('GuestPresence', GuestPresenceSchema);
