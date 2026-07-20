import { notFound } from "next/navigation";
import { WORLDS, WorldId } from "../../../lib/worlds";
import DanceGame from "./DanceGame";

export default async function DancePage({
  params,
}: {
  params: Promise<{ world: string }>;
}) {
  const { world: worldParam } = await params;
  const world = WORLDS[worldParam as WorldId];
  if (!world) notFound();

  return <DanceGame world={world} />;
}
