import { notFound } from "next/navigation";
import { WORLDS, WorldId } from "../../../lib/worlds";
import CountingGame from "./CountingGame";

export default async function ContarPage({
  params,
}: {
  params: Promise<{ world: string }>;
}) {
  const { world: worldParam } = await params;
  const world = WORLDS[worldParam as WorldId];
  if (!world) notFound();

  return <CountingGame world={world} />;
}
