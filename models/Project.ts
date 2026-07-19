import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ProjectGithubSchema = new Schema(
  {
    repoFullName: { type: String },
    branch: { type: String },
    webhookConfiguredAt: { type: Date },
  },
  { _id: false }
);

const ProjectSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    archived: { type: Boolean, default: false },
    github: { type: ProjectGithubSchema, default: () => ({}) },
    createdBy: { type: String, required: true },
    members: { type: [String], default: [], index: true },
    ticketSequence: { type: Number, default: 0 },
    themeColor: { type: String, default: "#00ff41" },
  },
  { timestamps: true }
);

ProjectSchema.index({ organizationId: 1, archived: 1 });
ProjectSchema.index({ organizationId: 1, members: 1 });
ProjectSchema.index({ organizationId: 1, "github.repoFullName": 1 });

export type IProject = InferSchemaType<typeof ProjectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Project: Model<IProject> =
  mongoose.models.Project ?? mongoose.model<IProject>("Project", ProjectSchema);
