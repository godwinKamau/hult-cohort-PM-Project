/**
 * Seed demo data for smoke testing.
 * Usage: npx tsx scripts/seed.ts <orgId> <userId>
 */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Set MONGODB_URI");
  process.exit(1);
}

const orgId = process.argv[2];
const userId = process.argv[3];

if (!orgId || !userId) {
  console.error("Usage: npx tsx scripts/seed.ts <orgId> <userId>");
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);

const Project = mongoose.model(
  "Project",
  new mongoose.Schema({
    organizationId: String,
    name: String,
    description: String,
    archived: { type: Boolean, default: false },
    github: {
      repoFullName: String,
      branch: String,
    },
    createdBy: String,
  })
);

const Ticket = mongoose.model(
  "Ticket",
  new mongoose.Schema({
    organizationId: String,
    projectId: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    status: { type: String, enum: ["todo", "in_progress", "done"] },
    position: Number,
    assigneeClerkId: String,
    tagIds: [mongoose.Schema.Types.ObjectId],
    createdBy: String,
  })
);

const Tag = mongoose.model(
  "Tag",
  new mongoose.Schema({
    organizationId: String,
    name: String,
    color: String,
  })
);

const project = await Project.create({
  organizationId: orgId,
  name: "Demo Project",
  description: "Seeded for smoke testing",
  createdBy: userId,
  github: { repoFullName: "owner/demo-repo", branch: "main" },
});

const tag = await Tag.create({
  organizationId: orgId,
  name: "demo",
  color: "#00ff41",
});

const tickets: { title: string; status: "todo" | "in_progress" | "done"; position: number }[] = [
  { title: "Setup auth", status: "done", position: 1000 },
  { title: "Build Kanban", status: "in_progress", position: 1000 },
  { title: "Wire GitHub webhooks", status: "todo", position: 1000 },
];

for (const t of tickets) {
  await Ticket.create({
    organizationId: orgId,
    projectId: project._id,
    title: t.title,
    description: `Seeded ticket: ${t.title}`,
    status: t.status,
    position: t.position,
    assigneeClerkId: userId,
    tagIds: [tag._id],
    createdBy: userId,
  });
}

console.log(`Seeded project: ${project._id}`);
console.log("Done.");
await mongoose.disconnect();
