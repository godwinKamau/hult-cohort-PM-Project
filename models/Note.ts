import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const NoteSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    authorClerkId: { type: String, required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

NoteSchema.index({ organizationId: 1, ticketId: 1, createdAt: 1 });

export type INote = InferSchemaType<typeof NoteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Note: Model<INote> =
  mongoose.models.Note ?? mongoose.model<INote>("Note", NoteSchema);
