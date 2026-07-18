import { notFound } from "next/navigation";
import { WORLDS, WorldId } from "../../../lib/worlds";
import StoryTime from "./StoryTime";

export default async function CuentosPage({
  params,
}: {
  params: Promise<{ world: string }>;
}) {
  const { world: worldParam } = await params;
  const world = WORLDS[worldParam as WorldId];
  if (!world) notFound();

  return <StoryTime world={world} />;
}
