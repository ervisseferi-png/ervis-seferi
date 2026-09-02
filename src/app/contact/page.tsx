import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter Ervis Seferi pour un échange sur la finance, la trésorerie ou l'automatisation.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl text-white md:text-5xl">Contact</h1>
      <p className="mt-4 text-slate-400 leading-relaxed max-w-xl">
        Pour une prise de contact simple et directe, écrivez-moi. Je réponds
        personnellement.
      </p>

      <div className="mt-12 glass-card rounded-2xl p-8 md:p-10">
        <div className="space-y-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Email
            </div>
            <a
              href="mailto:ervis.seferi@protonmail.com"
              className="mt-2 inline-block text-lg text-gold-400 hover:text-gold-500 transition"
            >
              ervis.seferi@protonmail.com
            </a>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Domaines
            </div>
            <p className="mt-2 text-slate-300">
              Comptabilité · Trésorerie · Analyse financière · IA &
              Automatisation appliquée à la Finance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
