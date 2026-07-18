import Image from "next/image";
import Link from "next/link";
import { World } from "../lib/worlds";
import SoundToggle from "./SoundToggle";

export default function GameTopBar({
  world,
  title,
}: {
  world: World;
  title: string;
}) {
  return (
    <div className="flex w-full max-w-3xl items-center justify-between">
      <Link
        href={`/juegos/${world.id}`}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-md active:scale-90"
        aria-label="Volver"
      >
        ⬅️
      </Link>
      <div className="flex items-center gap-3 rounded-full bg-white/90 py-2 pl-2 pr-5 shadow-md">
        <Image
          src={world.colorImage}
          alt={world.title}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
        />
        <span className="text-lg font-bold text-violet-700">{title}</span>
      </div>
      <SoundToggle />
    </div>
  );
}
