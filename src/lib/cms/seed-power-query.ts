import type { CmsDocument } from "./document";
import type { Post } from "./types";
import fondamentauxHtml from "./content/power-query-fondamentaux.html?raw";
import grandLivreHtml from "./content/power-query-grand-livre.html?raw";
import exercicesHtml from "./content/power-query-exercices.html?raw";

const NOW = "2026-09-02T10:00:00.000Z";

const IA_SLUG = "ia-automatisation";
const POWER_BI_SLUG = "power-bi";

type SeedPost = Omit<Post, "id">;

const SEED_POSTS: SeedPost[] = [
  {
    title: "Power Query : les fondamentaux",
    slug: "power-query-fondamentaux",
    excerpt:
      "Pourquoi Power Query change le travail comptable, le vocabulaire utile, l’éditeur dans Excel, et les fichiers de la leçon. Première fiche d’un parcours débutant.",
    content: fondamentauxHtml,
    cover_image: "/kb/power-query/cover-fondamentaux.jpg",
    seo_title: "Power Query, les fondamentaux (Excel)",
    seo_description:
      "Importer, transformer et rejouer un nettoyage de données dans Excel avec Power Query. Vocabulaire, éditeur, fichiers d’exercice et vidéo.",
    status: "published",
    published_at: NOW,
    scheduled_at: null,
    show_published_date: false,
    show_updated_date: false,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    title: "Power Query : nettoyer un grand livre",
    slug: "power-query-grand-livre",
    excerpt:
      "Trois exemples concrets : types français, dates mélangées, doublon, plan comptable. Totaux exacts, à refaire dans Excel.",
    content: grandLivreHtml,
    cover_image: "/kb/power-query/cover-grand-livre.jpg",
    seo_title: "Nettoyer un grand livre avec Power Query",
    seo_description:
      "Fiabiliser un grand livre CSV dans Excel : montants français, dates, libellés, doublons et comptes hors plan.",
    status: "published",
    published_at: NOW,
    scheduled_at: null,
    show_published_date: false,
    show_updated_date: false,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    title: "Power Query : exercices et actualisation",
    slug: "power-query-exercices",
    excerpt:
      "Journal des ventes, soldes par compte, puis la preuve : deux lignes de plus dans le CSV, un clic sur Actualiser tout.",
    content: exercicesHtml,
    cover_image: "/kb/power-query/cover-exercices.jpg",
    seo_title: "Exercices Power Query (grand livre)",
    seo_description:
      "Trois exercices Power Query sur un grand livre réel : filtre journal VE, soldes par compte, actualisation automatique.",
    status: "published",
    published_at: NOW,
    scheduled_at: null,
    show_published_date: false,
    show_updated_date: false,
    created_at: NOW,
    updated_at: NOW,
  },
];

function isPowerBiCategory(name: string, slug: string) {
  const n = name.trim().toLowerCase();
  const s = slug.trim().toLowerCase();
  return s === POWER_BI_SLUG || s === "powerbi" || n === "power bi" || n === "powerbi";
}

export function mergePowerQuerySeed(doc: CmsDocument): CmsDocument {
  const ia =
    doc.categories.find((c) => c.slug === IA_SLUG) ??
    doc.categories.find((c) => c.parent_id == null && /ia/i.test(c.name));
  if (!ia) return doc;

  let powerBi = doc.categories.find((c) => isPowerBiCategory(c.name, c.slug));
  if (!powerBi) {
    powerBi = {
      id: doc.nextCategoryId++,
      name: "Power BI",
      slug: POWER_BI_SLUG,
      description: "Power Query, préparation des données et automatisation",
      sort_order: doc.categories.filter((c) => c.parent_id === ia.id).length,
      parent_id: ia.id,
    };
    doc.categories.push(powerBi);
  }

  SEED_POSTS.forEach((seed, index) => {
    let post = doc.posts.find((p) => p.slug === seed.slug);
    if (!post) {
      post = { ...seed, id: doc.nextPostId++ };
      doc.posts.push(post);
    }
    const linked = doc.links.some(
      (l) => l.post_id === post.id && l.category_id === powerBi.id,
    );
    if (!linked) {
      doc.links.push({
        post_id: post.id,
        category_id: powerBi.id,
        sort_order: index,
      });
    }
  });

  return doc;
}
