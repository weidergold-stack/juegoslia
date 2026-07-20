import { notFound } from "next/navigation";
import { WORLDS, WorldId } from "../../../lib/worlds";
import VestirGame from "./VestirGame";

export default async function VestirPage({
  params,
}: {
  params: Promise<{ world: string }>;
}) {
  const { world: worldParam } = await params;
  const world = WORLDS[worldParam as WorldId];
  if (!world) notFound();

  return <VestirGame world={world} />;
}
