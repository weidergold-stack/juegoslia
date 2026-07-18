import { notFound } from "next/navigation";
import { WORLDS, WorldId } from "../../../lib/worlds";
import RaceGame from "./RaceGame";

export default async function CarreraPage({
  params,
}: {
  params: Promise<{ world: string }>;
}) {
  const { world: worldParam } = await params;
  const world = WORLDS[worldParam as WorldId];
  if (!world) notFound();

  return <RaceGame world={world} />;
}
