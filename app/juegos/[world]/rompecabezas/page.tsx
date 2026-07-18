import { notFound } from "next/navigation";
import { WORLDS, WorldId } from "../../../lib/worlds";
import PuzzleGame from "./PuzzleGame";

export default async function RompecabezasPage({
  params,
}: {
  params: Promise<{ world: string }>;
}) {
  const { world: worldParam } = await params;
  const world = WORLDS[worldParam as WorldId];
  if (!world) notFound();

  return <PuzzleGame world={world} />;
}
