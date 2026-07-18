import { notFound } from "next/navigation";
import { WORLDS, WorldId } from "../../../lib/worlds";
import MemoryGame from "./MemoryGame";

export default async function MemoriaPage({
  params,
}: {
  params: Promise<{ world: string }>;
}) {
  const { world: worldParam } = await params;
  const world = WORLDS[worldParam as WorldId];
  if (!world) notFound();

  return <MemoryGame world={world} />;
}
