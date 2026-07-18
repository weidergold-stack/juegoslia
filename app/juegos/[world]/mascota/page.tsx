import { notFound } from "next/navigation";
import { WORLDS, WorldId } from "../../../lib/worlds";
import CatGame from "./CatGame";

export default async function MascotaPage({
  params,
}: {
  params: Promise<{ world: string }>;
}) {
  const { world: worldParam } = await params;
  const world = WORLDS[worldParam as WorldId];
  if (!world) notFound();

  return <CatGame world={world} />;
}
