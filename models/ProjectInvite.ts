import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ProjectInviteSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    inviterClerkId: { type: String, required: true },
    inviteeClerkId: { type: String, index: true },
    inviteeEmail: { type: String, lowercase: true, trim: true, index: true },
    clerkInvitationId: { type: String },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

ProjectInviteSchema.index(
  { projectId: 1, inviteeClerkId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      inviteeClerkId: { $type: "string" },
      status: "pending",
    },
  }
);
ProjectInviteSchema.index(
  { projectId: 1, inviteeEmail: 1 },
  {
    unique: true,
    partialFilterExpression: {
      inviteeEmail: { $type: "string" },
      status: "pending",
    },
  }
);
ProjectInviteSchema.index({ inviteeClerkId: 1, status: 1 });
ProjectInviteSchema.index({ inviteeEmail: 1, status: 1 });

export type IProjectInvite = InferSchemaType<typeof ProjectInviteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ProjectInvite: Model<IProjectInvite> =
  mongoose.models.ProjectInvite ??
  mongoose.model<IProjectInvite>("ProjectInvite", ProjectInviteSchema);
