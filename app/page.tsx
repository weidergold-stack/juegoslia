import Image from "next/image";
import Link from "next/link";
import { WORLD_LIST } from "./lib/worlds";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center bg-[radial-gradient(circle_at_top,#fef3c7,#fff7ed_60%)] px-6 py-10">
      <h1 className="text-center text-4xl font-bold text-violet-700 sm:text-5xl">
        ¡Vamos a jugar! 🎉
      </h1>
      <p className="mt-3 text-center text-xl text-violet-500">
        Elige a tu amiga para empezar
      </p>

      <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
        {WORLD_LIST.map((world) => (
          <Link
            key={world.id}
            href={`/juegos/${world.id}`}
            className={`group flex flex-col items-center rounded-[2.5rem] bg-gradient-to-b ${world.gradient} p-6 text-center shadow-xl transition-transform active:scale-95 sm:hover:-translate-y-2`}
          >
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-inner sm:h-48 sm:w-48">
              <Image
                src={world.colorImage}
                alt={world.title}
                width={180}
                height={180}
                preload
                className="h-full w-full rounded-full object-cover p-2"
              />
            </div>
            <span className="mt-4 text-2xl font-bold text-white drop-shadow">
              {world.emoji} {world.name}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
