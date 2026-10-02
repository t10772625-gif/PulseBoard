import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeatureDetail } from "@/components/site/FeaturesView";
import { SITE_FEATURES, featureBySlug } from "@/lib/site";
import { translate } from "@/i18n";

// One page per core feature, built at compile time
export function generateStaticParams() {
  return SITE_FEATURES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const f = featureBySlug((await params).slug);
  if (!f) return { title: "PulseBoard" };
  return { title: `${translate("en", f.title)} — PulseBoard`, description: translate("en", f.lead) };
}

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!featureBySlug(slug)) notFound();
  return <FeatureDetail slug={slug} />;
}
