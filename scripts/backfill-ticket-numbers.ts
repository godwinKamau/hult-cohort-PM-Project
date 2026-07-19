/**
 * Backfill stable per-project ticket numbers for existing data.
 * Usage: npx tsx scripts/backfill-ticket-numbers.ts
 */
import mongoose from "mongoose";

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("Set MONGODB_URI");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);

  const Project = mongoose.model(
    "Project",
    new mongoose.Schema({
      organizationId: String,
      ticketSequence: { type: Number, default: 0 },
    })
  );

  const Ticket = mongoose.model(
    "Ticket",
    new mongoose.Schema({
      organizationId: String,
      projectId: mongoose.Schema.Types.ObjectId,
      number: Number,
      createdAt: Date,
    })
  );

  const projects = await Project.find({}).lean();
  let updatedTickets = 0;

  for (const project of projects) {
    const tickets = await Ticket.find({ projectId: project._id })
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    let nextNumber = 1;
    for (const ticket of tickets) {
      if (typeof ticket.number === "number" && ticket.number > 0) {
        nextNumber = Math.max(nextNumber, ticket.number + 1);
        continue;
      }

      await Ticket.updateOne(
        { _id: ticket._id },
        { $set: { number: nextNumber } }
      );
      updatedTickets += 1;
      nextNumber += 1;
    }

    await Project.updateOne(
      { _id: project._id },
      {
        $set: {
          ticketSequence: Math.max(project.ticketSequence ?? 0, nextNumber - 1),
        },
      }
    );

    console.log(
      `Project ${project._id}: ${tickets.length} tickets, next number ${nextNumber}`
    );
  }

  console.log(`Backfill complete. Updated ${updatedTickets} tickets.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
