import { HomePageView } from "@/components/home/HomePageView";
import { fetchPublicHomePageContent } from "@/lib/portal/homePageServer";

export default async function Home() {
  const content = await fetchPublicHomePageContent();
  return <HomePageView content={content} />;
}
