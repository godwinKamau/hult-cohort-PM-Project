import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const OrganizationSchema = new Schema(
  {
    clerkOrgId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
  },
  { timestamps: true }
);

export type IOrganization = InferSchemaType<typeof OrganizationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Organization: Model<IOrganization> =
  mongoose.models.Organization ??
  mongoose.model<IOrganization>("Organization", OrganizationSchema);
