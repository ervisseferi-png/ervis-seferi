import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* subtle background shapes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-gold-500/5 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-24">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          {/* Main hero card */}
          <div className="glass-card rounded-3xl p-10 md:p-14 shadow-2xl">
            <div className="inline-flex items-center rounded-full border border-gold-500/25 bg-gold-500/10 px-4 py-1.5 text-xs font-medium tracking-wider text-gold-400">
              ERVIS SEFERI
            </div>

            <h1 className="mt-8 font-serif text-5xl leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
              Ervis
              <br />
              Seferi
            </h1>

            <p className="mt-8 max-w-lg text-base leading-relaxed text-slate-300 md:text-lg">
              Comptabilité, trésorerie, analyse financière, IA et automatisation
              appliquée à la Finance. Un regard pratique pour les dirigeants,
              indépendants et petites structures qui veulent mieux piloter leurs
              chiffres.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/blog"
                className="inline-flex items-center rounded-full bg-gold-500 px-7 py-3 text-sm font-medium text-navy-950 transition hover:bg-gold-400"
              >
                Lire les articles
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Me contacter
              </Link>
            </div>
          </div>

          {/* Side cards */}
          <div className="flex flex-col gap-5">
            <div className="glass-card rounded-2xl p-7">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gold-400">
                Expertise
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                Comptabilité, trésorerie, analyse financière et IA appliquée :
                chaque sujet est traité avec une logique de terrain, loin du
                jargon inutile.
              </p>
              <div className="mt-6 flex gap-3">
                <div className="rounded-xl bg-navy-800/80 px-4 py-3 text-center">
                  <div className="text-lg font-medium text-white">—</div>
                  <div className="text-[11px] text-slate-400">articles</div>
                </div>
                <div className="rounded-xl bg-navy-800/80 px-4 py-3 text-center">
                  <div className="text-lg font-medium text-gold-400">4</div>
                  <div className="text-[11px] text-slate-400">domaines clés</div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-7">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gold-400">
                Pourquoi ce site
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                Donner un point d&apos;entrée clair à une expertise terrain en
                finance et en technologie, avec un blog lisible en public et une
                interface d&apos;administration pour publier rapidement.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom domains strip */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Comptabilité", desc: "Lecture claire des chiffres" },
            { title: "Trésorerie", desc: "Pilotage du cash au quotidien" },
            {
              title: "Analyse financière",
              desc: "Décisions basées sur les données",
            },
            {
              title: "IA & Automatisation",
              desc: "Gains de temps concrets",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/5 bg-navy-800/40 px-5 py-5"
            >
              <div className="text-sm font-medium text-white">{item.title}</div>
              <div className="mt-1 text-xs text-slate-400">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
