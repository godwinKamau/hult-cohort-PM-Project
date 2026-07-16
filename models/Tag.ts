import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const TagSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    color: { type: String, required: true, default: "#00ff41" },
  },
  { timestamps: true }
);

TagSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export type ITag = InferSchemaType<typeof TagSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Tag: Model<ITag> =
  mongoose.models.Tag ?? mongoose.model<ITag>("Tag", TagSchema);
