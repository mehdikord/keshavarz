import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ServiceIntroScreen } from "@/components/service-intro/service-intro-screen";
import { RichContentView } from "@/components/shared/rich-content-view";
import { richDocPlainText } from "@/lib/rich-content/rich-content";
import { CatalogSlugSchema } from "@/server/modules/catalog/catalog.schemas";
import { getServiceIntro } from "@/server/modules/catalog/catalog.service";

// Admin edits must show up right away (the catalog cache is invalidated on save).
export const dynamic = "force-dynamic";

type Params = Promise<{ serviceId: string }>;

const loadIntro = cache(async (raw: string) => {
  const slug = CatalogSlugSchema.safeParse(decodeURIComponent(raw));
  return slug.success ? getServiceIntro(slug.data) : null;
});

/** ~200 Persian words a minute, never less than one. */
function readingMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const intro = await loadIntro((await params).serviceId);
  if (!intro) return { title: "خدمت پیدا نشد" };
  const summary = intro.description ?? richDocPlainText(intro.details).slice(0, 180);
  return {
    description: summary || `معرفی ${intro.name} در دسته ${intro.category.name}`,
    openGraph: {
      description: summary || undefined,
      images: intro.image ? [{ url: intro.image }] : undefined,
      title: intro.name,
    },
    title: intro.name,
  };
}

/** Public intro page of a catalog service (equipment): picture, category and the admin's full write-up. */
export default async function ServiceIntroPage({ params }: { params: Params }) {
  const intro = await loadIntro((await params).serviceId);
  if (!intro) notFound();

  const text = richDocPlainText(intro.details);

  return (
    <ServiceIntroScreen
      category={intro.category}
      description={intro.description}
      hasDetails={intro.details !== null}
      image={intro.image}
      isSpecial={intro.isSpecial}
      name={intro.name}
      readingMinutes={intro.details ? readingMinutes(text) : null}
      related={intro.related}
      serviceId={intro.serviceId}
      updatedAt={intro.updatedAt}
    >
      {intro.details ? <RichContentView doc={intro.details} /> : null}
    </ServiceIntroScreen>
  );
}
