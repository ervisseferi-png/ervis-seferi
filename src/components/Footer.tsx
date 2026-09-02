import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-24">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="font-serif text-xl text-white">Ervis Seferi</div>
            <p className="mt-2 max-w-sm text-sm text-slate-400 leading-relaxed">
              Comptabilité, trésorerie, analyse financière, IA et automatisation
              appliquée à la Finance.
            </p>
          </div>

          <div className="flex gap-10 text-sm">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Navigation
              </div>
              <Link href="/" className="block text-slate-400 hover:text-gold-400">
                Accueil
              </Link>
              <Link
                href="/blog"
                className="block text-slate-400 hover:text-gold-400"
              >
                Blog
              </Link>
              <Link
                href="/contact"
                className="block text-slate-400 hover:text-gold-400"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-xs text-slate-500 space-y-2">
          <p>
            © {new Date().getFullYear()} Ervis Seferi. Tous droits réservés.
          </p>
          <p className="text-slate-600 max-w-2xl">
            Certains contenus de ce site peuvent avoir été générés ou assistés
            par l&apos;IA à partir de mes sources et instructions. L&apos;IA a
            également pu être utilisée dans plusieurs étapes de la production.
          </p>
        </div>
      </div>
    </footer>
  );
}
