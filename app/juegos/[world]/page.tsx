import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GAMES, WORLDS, WorldId } from "../../lib/worlds";

export function generateStaticParams() {
  return Object.keys(WORLDS).map((world) => ({ world }));
}

export default async function WorldHub({
  params,
}: {
  params: Promise<{ world: string }>;
}) {
  const { world: worldParam } = await params;
  const world = WORLDS[worldParam as WorldId];
  if (!world) notFound();

  return (
    <main
      className={`flex flex-1 flex-col items-center bg-gradient-to-b ${world.gradient} px-6 py-8`}
    >
      <div className="flex w-full max-w-4xl items-center justify-between">
        <Link
          href="/"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-md active:scale-90"
          aria-label="Volver"
        >
          ⬅️
        </Link>
        <div className="flex items-center gap-3 rounded-full bg-white/90 py-2 pl-2 pr-5 shadow-md">
          <Image
            src={world.colorImage}
            alt={world.title}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
          <span className="text-xl font-bold text-violet-700">
            {world.title}
          </span>
        </div>
        <div className="w-12" />
      </div>

      <h2 className="mt-8 text-center text-3xl font-bold text-white drop-shadow sm:text-4xl">
        ¿A qué quieres jugar?
      </h2>

      <div className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-6">
        {GAMES.map((game, i) => (
          <Link
            key={game.id}
            href={`/juegos/${world.id}/${game.id}`}
            className={`flex flex-col items-center justify-center gap-2 rounded-[2rem] bg-gradient-to-b ${game.gradient} p-6 text-center shadow-xl transition-transform active:scale-95 sm:hover:-translate-y-1 ${
              i === GAMES.length - 1 && GAMES.length % 2 === 1
                ? "col-span-2"
                : ""
            }`}
          >
            <span className="text-6xl">{game.emoji}</span>
            <span className="text-2xl font-bold text-white drop-shadow">
              {game.name}
            </span>
            <span className="text-sm font-medium text-white/90">
              {game.description}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
