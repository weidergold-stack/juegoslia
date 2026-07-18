import { notFound } from "next/navigation";
import { WORLDS, WorldId } from "../../../lib/worlds";
import ColoringGame from "./ColoringGame";

export default async function ColorearPage({
  params,
}: {
  params: Promise<{ world: string }>;
}) {
  const { world: worldParam } = await params;
  const world = WORLDS[worldParam as WorldId];
  if (!world) notFound();

  return <ColoringGame world={world} />;
}
