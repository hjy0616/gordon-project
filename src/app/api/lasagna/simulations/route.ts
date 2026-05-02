import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import { trackEvent } from "@/lib/analytics";
import type { SimulationStatus } from "@/generated/prisma/enums";
import type { Simulation } from "@/types/lasagna";

function toClient(row: {
  id: string;
  title: string;
  eventType: string;
  eventDescription: string;
  currentStep: number;
  status: SimulationStatus;
  steps: unknown;
  crowdAnalysis: unknown;
  myAnalysis: unknown;
  flowNodes: unknown;
  flowEdges: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Simulation {
  return {
    id: row.id,
    title: row.title,
    eventType: row.eventType,
    eventDescription: row.eventDescription,
    currentStep: row.currentStep,
    status: row.status === "in_progress" ? "in_progress" : "completed",
    steps: (row.steps ?? {}) as Simulation["steps"],
    crowdAnalysis: (row.crowdAnalysis ?? {
      emotion: "",
      action: "",
      narrative: "",
    }) as Simulation["crowdAnalysis"],
    myAnalysis: (row.myAnalysis ?? {
      structure: "",
      action: "",
      reason: "",
    }) as Simulation["myAnalysis"],
    flowNodes: (row.flowNodes ?? []) as Simulation["flowNodes"],
    flowEdges: (row.flowEdges ?? []) as Simulation["flowEdges"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.lasagnaSimulation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rows.map(toClient));
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const row = await prisma.lasagnaSimulation.create({
    data: {
      id: body.id,
      userId: user.id,
      title: body.title,
      eventType: body.eventType,
      eventDescription: body.eventDescription,
      currentStep: body.currentStep ?? 1,
      status: (body.status as SimulationStatus) ?? "in_progress",
      steps: body.steps ?? {},
      crowdAnalysis: body.crowdAnalysis ?? {
        emotion: "",
        action: "",
        narrative: "",
      },
      myAnalysis: body.myAnalysis ?? {
        structure: "",
        action: "",
        reason: "",
      },
      flowNodes: body.flowNodes ?? [],
      flowEdges: body.flowEdges ?? [],
    },
  });

  await trackEvent({
    userId: user.id,
    type: "lasagna.start",
    label: row.title,
    props: { simulationId: row.id, eventType: row.eventType },
  });

  return NextResponse.json(toClient(row), { status: 201 });
}

export async function PUT(req: Request) {
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...fields } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (fields.title !== undefined) data.title = fields.title;
  if (fields.eventType !== undefined) data.eventType = fields.eventType;
  if (fields.eventDescription !== undefined)
    data.eventDescription = fields.eventDescription;
  if (fields.currentStep !== undefined) data.currentStep = fields.currentStep;
  if (fields.status !== undefined) data.status = fields.status;
  if (fields.steps !== undefined) data.steps = fields.steps;
  if (fields.crowdAnalysis !== undefined)
    data.crowdAnalysis = fields.crowdAnalysis;
  if (fields.myAnalysis !== undefined) data.myAnalysis = fields.myAnalysis;
  if (fields.flowNodes !== undefined) data.flowNodes = fields.flowNodes;
  if (fields.flowEdges !== undefined) data.flowEdges = fields.flowEdges;

  if (fields.status === "completed") {
    // Atomic transition: only fire trackEvent when this request is the one
    // that flips status from non-completed to completed.
    const transition = await prisma.lasagnaSimulation.updateMany({
      where: { id, userId: user.id, status: { not: "completed" } },
      data,
    });

    if (transition.count === 1) {
      await trackEvent({
        userId: user.id,
        type: "lasagna.complete",
        path: id,
        props: { simulationId: id },
      });
      return NextResponse.json({ updated: 1 });
    }

    // Already completed — apply non-status field updates so the UI's
    // last-write still wins for analysis text, etc.
    const dataWithoutStatus: Record<string, unknown> = { ...data };
    delete dataWithoutStatus.status;
    if (Object.keys(dataWithoutStatus).length > 0) {
      const after = await prisma.lasagnaSimulation.updateMany({
        where: { id, userId: user.id },
        data: dataWithoutStatus,
      });
      return NextResponse.json({ updated: after.count });
    }
    return NextResponse.json({ updated: 0 });
  }

  const updated = await prisma.lasagnaSimulation.updateMany({
    where: { id, userId: user.id },
    data,
  });

  return NextResponse.json({ updated: updated.count });
}

export async function DELETE(req: Request) {
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const deleted = await prisma.lasagnaSimulation.deleteMany({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ deleted: deleted.count });
}
