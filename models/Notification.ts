import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const NotificationMetaSchema = new Schema(
  {
    repo: { type: String },
    branch: { type: String },
    actorGithubLogin: { type: String },
    commitCount: { type: Number },
    commitMessage: { type: String },
    prNumber: { type: Number },
    prAction: { type: String },
    url: { type: String },
    reactorClerkId: { type: String },
    reactorName: { type: String },
    originalNotificationId: { type: String },
  },
  { _id: false }
);

const NotificationSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    type: {
      type: String,
      enum: ["push", "pull_request", "reaction"],
      required: true,
    },
    title: { type: String, required: true },
    meta: { type: NotificationMetaSchema, default: () => ({}) },
    pusherClerkId: { type: String },
    recipientClerkId: { type: String, index: true },
    deliveryId: { type: String, unique: true, sparse: true },
    likeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

NotificationSchema.index({ organizationId: 1, createdAt: -1 });
NotificationSchema.index({ recipientClerkId: 1, createdAt: -1 });

export type INotification = InferSchemaType<typeof NotificationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Notification: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", NotificationSchema);
