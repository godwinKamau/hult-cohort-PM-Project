import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const TicketSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    number: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },
    position: { type: Number, default: 0 },
    assigneeClerkId: { type: String },
    tagIds: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    color: { type: String, default: "" },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

TicketSchema.index({ organizationId: 1, projectId: 1, status: 1, position: 1 });
TicketSchema.index({ organizationId: 1, assigneeClerkId: 1 });
TicketSchema.index(
  { organizationId: 1, projectId: 1, number: 1 },
  { unique: true }
);

export type ITicket = InferSchemaType<typeof TicketSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Ticket: Model<ITicket> =
  mongoose.models.Ticket ?? mongoose.model<ITicket>("Ticket", TicketSchema);
