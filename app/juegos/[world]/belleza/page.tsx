import { notFound } from "next/navigation";
import { WORLDS, WorldId } from "../../../lib/worlds";
import BeautyGame from "./BeautyGame";

export default async function BeautyPage({
  params,
}: {
  params: Promise<{ world: string }>;
}) {
  const { world: worldParam } = await params;
  const world = WORLDS[worldParam as WorldId];
  if (!world) notFound();

  return <BeautyGame world={world} />;
}
