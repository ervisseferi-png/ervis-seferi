import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getPublicSite } from "@/lib/cms/queries";
import { DEFAULT_CATEGORIES, DEFAULT_SITE } from "@/lib/cms/types";
import appCss from "../styles.css?url";

const APP_NAME = "Ervis Seferi";

export const Route = createRootRoute({
  loader: async () => {
    try {
      return await getPublicSite();
    } catch {
      return { site: DEFAULT_SITE, categories: DEFAULT_CATEGORIES };
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Comptabilité, trésorerie, analyse financière, IA et automatisation appliquée à la Finance.",
      },
      { name: "theme-color", content: "#060d1a" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Figtree:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  const { site } = Route.useLoaderData();

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Header site={site} />
          <main className="min-h-[70vh]">
            <Outlet />
          </main>
          <Footer site={site} />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
