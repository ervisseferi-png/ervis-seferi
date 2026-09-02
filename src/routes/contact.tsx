import { createFileRoute } from "@tanstack/react-router";
import { SocialLinks } from "@/components/social-links";
import { getPublicSite } from "@/lib/cms/queries";
import { DEFAULT_SITE } from "@/lib/cms/types";

export const Route = createFileRoute("/contact")({
  loader: async () => {
    try {
      return await getPublicSite();
    } catch {
      return { site: DEFAULT_SITE, categories: [] };
    }
  },
  component: ContactPage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.site.contact_title || "Contact"} | Ervis Seferi`,
      },
    ],
  }),
});

function ContactPage() {
  const { site } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
      <h1 className="font-serif text-4xl text-white md:text-5xl">{site.contact_title}</h1>
      <p className="mt-4 max-w-xl leading-relaxed text-slate-400">{site.contact_intro}</p>

      <div className="glass-card mt-12 rounded-2xl p-8 md:p-10">
        <div className="space-y-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Email</div>
            <a
              href={`mailto:${site.contact_email}`}
              className="mt-2 inline-block text-lg text-gold-400 transition hover:text-gold-500"
            >
              {site.contact_email}
            </a>
          </div>

          {site.contact_domains ? (
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Domaines
              </div>
              <p className="mt-2 text-slate-300">{site.contact_domains}</p>
            </div>
          ) : null}

          {site.linkedin_url || site.x_url ? (
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Réseaux
              </div>
              <SocialLinks
                linkedin={site.linkedin_url}
                x={site.x_url}
                className="mt-3"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
