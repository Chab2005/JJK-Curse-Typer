import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Hero from "@/components/home/Hero";
import JoinForm from "@/components/home/JoinForm";
import PublicLobbies from "@/components/home/PublicLobbies";
import type { Locale } from "@/i18n/config";
import { setRequestLocale } from "next-intl/server";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <>
      <Header />
      <main className="w-full pt-20 bg-surface flex-1 flex flex-col">
        <div className="relative w-full overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-25">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-primary-container blur-[140px] rounded-full"></div>
            <div className="absolute top-96 right-10 w-[360px] h-[360px] bg-secondary-container blur-[120px] rounded-full"></div>
            <div className="absolute bottom-10 left-8 w-[300px] h-[300px] bg-tertiary-container blur-[100px] rounded-full"></div>
          </div>
          <div className="relative max-w-6xl mx-auto px-space-md lg:px-margin pt-space-lg pb-space-xl flex flex-col gap-space-xl">
            <Hero />
            <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              <JoinForm />
              <PublicLobbies />
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
