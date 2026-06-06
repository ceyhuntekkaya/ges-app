export type PortalHomePageContent = {
  id: string;
  badgeText: string;
  heroTitle: string;
  heroDescription: string;
  heroPrimaryCtaText: string;
  heroSecondaryCtaText: string;
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
  feature3Title: string;
  feature3Description: string;
  heroImageUrl?: string | null;
  sidebarImage1Url?: string | null;
  sidebarImage2Url?: string | null;
  sidebarCardTitle: string;
  sidebarCardDescription: string;
  sidebarCardPrimaryCtaText: string;
  sidebarCardSecondaryCtaText: string;
  aboutSectionLabel: string;
  aboutSectionTitle: string;
  aboutSectionCtaText: string;
  aboutFeature1Title: string;
  aboutFeature1Description: string;
  aboutFeature2Title: string;
  aboutFeature2Description: string;
  aboutFeature3Title: string;
  aboutFeature3Description: string;
  processSectionTitle: string;
  processStep1Title: string;
  processStep1Description: string;
  processStep2Title: string;
  processStep2Description: string;
  processStep3Title: string;
  processStep3Description: string;
  processImageUrl?: string | null;
  processImageCaption?: string | null;
  gallerySectionLabel: string;
  gallerySectionTitle: string;
  gallerySectionCtaText: string;
  galleryImage1Url?: string | null;
  galleryImage2Url?: string | null;
  galleryImage3Url?: string | null;
  galleryImage4Url?: string | null;
  galleryImage5Url?: string | null;
  galleryImage6Url?: string | null;
};

export type PortalHomePageContentUpdateRequest = Omit<PortalHomePageContent, "id">;

export function toProxyMediaUrl(url?: string | null): string | null {
  const u = (url ?? "").trim();
  if (!u) return null;
  if (u.startsWith("/v1/")) return `/api/proxy${u}`;
  return u;
}

export const HOME_PAGE_FALLBACK: PortalHomePageContent = {
  id: "a0000000-0000-4000-8000-000000000001",
  badgeText: "2026 Dönemi Başvuruları Açık",
  heroTitle: "Yurt dışı dil kampına başvurunu kolayca tamamla.",
  heroDescription:
    "GES ile program seçimi, evrak hazırlığı ve başvuru sürecini tek ekrandan yönet. Başvurunu oluştur, gerekli belgeleri yükle, durumunu adım adım takip et.",
  heroPrimaryCtaText: "Başvuruyu Başlat",
  heroSecondaryCtaText: "Programı İncele",
  feature1Title: "Hızlı Başvuru",
  feature1Description: "Dakikalar içinde formu tamamla, süreci başlat.",
  feature2Title: "Evrak Yönetimi",
  feature2Description: "Gerekli belgeleri tek yerden yükle ve takip et.",
  feature3Title: "Durum Takibi",
  feature3Description: "Başvurunun hangi aşamada olduğunu anlık gör.",
  sidebarCardTitle: "Dil Kampı Başvurusu",
  sidebarCardDescription:
    "Başvuru oluşturduktan sonra evraklarını yükleyebilir ve değerlendirme sürecini panelden takip edebilirsin.",
  sidebarCardPrimaryCtaText: "Başvur",
  sidebarCardSecondaryCtaText: "Giriş",
  aboutSectionLabel: "Program Hakkında",
  aboutSectionTitle: "Neler sunuyoruz?",
  aboutSectionCtaText: "Başvuru Formu",
  aboutFeature1Title: "Program Seçimi",
  aboutFeature1Description: "Hedef ülke ve kamp seçeneklerini incele, sana en uygun programı belirle.",
  aboutFeature2Title: "Evrak Kontrolü",
  aboutFeature2Description: "Belgeleri doğru formatta topla, eksik/yanlışları hızlıca tamamla.",
  aboutFeature3Title: "Şeffaf Süreç",
  aboutFeature3Description: "Başvurunun durumunu ve sonraki adımı panelde net şekilde gör.",
  processSectionTitle: "Süreç nasıl ilerliyor?",
  processStep1Title: "1) Başvuru Oluştur",
  processStep1Description: "Kısa formu doldur ve başvurunu başlat.",
  processStep2Title: "2) Belgeleri Yükle",
  processStep2Description: "Gerekli evrakları yükle, eksikleri tamamla.",
  processStep3Title: "3) Değerlendirme & Bilgilendirme",
  processStep3Description: "Başvurun incelenir; durum güncellemelerini panelden takip edersin.",
  processImageCaption:
    "Not: Görselleri daha sonra buraya ekleyebiliriz (kamp fotoğrafları, etkinlikler, sınıf ortamı, şehir/ülke).",
  gallerySectionLabel: "Görsel Galeri",
  gallerySectionTitle: "Atmosferi hisset",
  gallerySectionCtaText: "Hemen Başvur",
};
