"use client";

import * as React from "react";
import {
  HOME_PAGE_FALLBACK,
  type PortalHomePageContent,
  type PortalHomePageContentUpdateRequest,
} from "@/lib/portal/homePage";
import {
  Button,
  FileUploadInput,
  Input,
  PageHeader,
  Textarea,
  useToast,
} from "@/components/ui";

const PUBLIC_FILE_DOWNLOAD = (id: string) =>
  `/api/proxy/v1/public/files/${encodeURIComponent(id)}/download`;

type FormState = PortalHomePageContentUpdateRequest;

function toFormState(data: PortalHomePageContent): FormState {
  const { id: _id, ...rest } = data;
  return {
    ...rest,
    heroImageUrl: rest.heroImageUrl ?? "",
    sidebarImage1Url: rest.sidebarImage1Url ?? "",
    sidebarImage2Url: rest.sidebarImage2Url ?? "",
    processImageUrl: rest.processImageUrl ?? "",
    processImageCaption: rest.processImageCaption ?? "",
    galleryImage1Url: rest.galleryImage1Url ?? "",
    galleryImage2Url: rest.galleryImage2Url ?? "",
    galleryImage3Url: rest.galleryImage3Url ?? "",
    galleryImage4Url: rest.galleryImage4Url ?? "",
    galleryImage5Url: rest.galleryImage5Url ?? "",
    galleryImage6Url: rest.galleryImage6Url ?? "",
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

export function AdminHomePageContentClient() {
  const toast = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(() => toFormState(HOME_PAGE_FALLBACK));

  const set = React.useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/proxy/v1/admin/home-page", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as PortalHomePageContent;
        if (!cancelled) setForm(toFormState(data));
      } catch {
        if (!cancelled) toast.error({ title: "Ana sayfa içeriği yüklenemedi" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/proxy/v1/admin/home-page", {
        method: "PUT",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(err?.message || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as PortalHomePageContent;
      setForm(toFormState(data));
      toast.success({ title: "Ana sayfa kaydedildi" });
    } catch (e) {
      toast.error({
        title: "Kayıt başarısız",
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-[var(--text-tertiary)]">Yükleniyor…</div>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ana Sayfa İçeriği"
        description="Portal ana sayfasındaki metin ve görselleri düzenleyin. Tek kayıt vardır; silme veya yeni ekleme yapılamaz."
        actions={
          <Button variant="primary" size="md" disabled={saving} onClick={() => void save()}>
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        }
      />

      <Section title="Hero">
        <Input label="Rozet metni" value={form.badgeText} onChange={(e) => set("badgeText", e.target.value)} />
        <Input label="Başlık" value={form.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
        <Textarea
          label="Açıklama"
          textareaSize="md"
          value={form.heroDescription}
          onChange={(e) => set("heroDescription", e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Birincil CTA"
            value={form.heroPrimaryCtaText}
            onChange={(e) => set("heroPrimaryCtaText", e.target.value)}
          />
          <Input
            label="İkincil CTA"
            value={form.heroSecondaryCtaText}
            onChange={(e) => set("heroSecondaryCtaText", e.target.value)}
          />
        </div>
      </Section>

      <Section title="Özellik kartları (üst)">
        <Input label="Kart 1 başlık" value={form.feature1Title} onChange={(e) => set("feature1Title", e.target.value)} />
        <Textarea
          label="Kart 1 açıklama"
          textareaSize="sm"
          value={form.feature1Description}
          onChange={(e) => set("feature1Description", e.target.value)}
        />
        <Input label="Kart 2 başlık" value={form.feature2Title} onChange={(e) => set("feature2Title", e.target.value)} />
        <Textarea
          label="Kart 2 açıklama"
          textareaSize="sm"
          value={form.feature2Description}
          onChange={(e) => set("feature2Description", e.target.value)}
        />
        <Input label="Kart 3 başlık" value={form.feature3Title} onChange={(e) => set("feature3Title", e.target.value)} />
        <Textarea
          label="Kart 3 açıklama"
          textareaSize="sm"
          value={form.feature3Description}
          onChange={(e) => set("feature3Description", e.target.value)}
        />
      </Section>

      <Section title="Sağ panel görselleri ve kart">
        <FileUploadInput
          label="Hero görseli"
          accept="image/*"
          purpose="HOME_PAGE_MEDIA"
          uploadUrl="/api/proxy/v1/admin/files"
          getDownloadUrl={PUBLIC_FILE_DOWNLOAD}
          value={form.heroImageUrl ?? ""}
          onChange={(v) => set("heroImageUrl", v)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FileUploadInput
            label="Görsel 1"
            accept="image/*"
            purpose="HOME_PAGE_MEDIA"
            uploadUrl="/api/proxy/v1/admin/files"
            getDownloadUrl={PUBLIC_FILE_DOWNLOAD}
            value={form.sidebarImage1Url ?? ""}
            onChange={(v) => set("sidebarImage1Url", v)}
          />
          <FileUploadInput
            label="Görsel 2"
            accept="image/*"
            purpose="HOME_PAGE_MEDIA"
            uploadUrl="/api/proxy/v1/admin/files"
            getDownloadUrl={PUBLIC_FILE_DOWNLOAD}
            value={form.sidebarImage2Url ?? ""}
            onChange={(v) => set("sidebarImage2Url", v)}
          />
        </div>
        <Input
          label="Kart başlığı"
          value={form.sidebarCardTitle}
          onChange={(e) => set("sidebarCardTitle", e.target.value)}
        />
        <Textarea
          label="Kart açıklaması"
          textareaSize="sm"
          value={form.sidebarCardDescription}
          onChange={(e) => set("sidebarCardDescription", e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Kart birincil CTA"
            value={form.sidebarCardPrimaryCtaText}
            onChange={(e) => set("sidebarCardPrimaryCtaText", e.target.value)}
          />
          <Input
            label="Kart ikincil CTA"
            value={form.sidebarCardSecondaryCtaText}
            onChange={(e) => set("sidebarCardSecondaryCtaText", e.target.value)}
          />
        </div>
      </Section>

      <Section title="Program hakkında">
        <Input
          label="Bölüm etiketi"
          value={form.aboutSectionLabel}
          onChange={(e) => set("aboutSectionLabel", e.target.value)}
        />
        <Input
          label="Bölüm başlığı"
          value={form.aboutSectionTitle}
          onChange={(e) => set("aboutSectionTitle", e.target.value)}
        />
        <Input
          label="CTA metni"
          value={form.aboutSectionCtaText}
          onChange={(e) => set("aboutSectionCtaText", e.target.value)}
        />
        <Input
          label="Özellik 1 başlık"
          value={form.aboutFeature1Title}
          onChange={(e) => set("aboutFeature1Title", e.target.value)}
        />
        <Textarea
          label="Özellik 1 açıklama"
          textareaSize="sm"
          value={form.aboutFeature1Description}
          onChange={(e) => set("aboutFeature1Description", e.target.value)}
        />
        <Input
          label="Özellik 2 başlık"
          value={form.aboutFeature2Title}
          onChange={(e) => set("aboutFeature2Title", e.target.value)}
        />
        <Textarea
          label="Özellik 2 açıklama"
          textareaSize="sm"
          value={form.aboutFeature2Description}
          onChange={(e) => set("aboutFeature2Description", e.target.value)}
        />
        <Input
          label="Özellik 3 başlık"
          value={form.aboutFeature3Title}
          onChange={(e) => set("aboutFeature3Title", e.target.value)}
        />
        <Textarea
          label="Özellik 3 açıklama"
          textareaSize="sm"
          value={form.aboutFeature3Description}
          onChange={(e) => set("aboutFeature3Description", e.target.value)}
        />
      </Section>

      <Section title="Süreç">
        <Input
          label="Bölüm başlığı"
          value={form.processSectionTitle}
          onChange={(e) => set("processSectionTitle", e.target.value)}
        />
        <Input
          label="Adım 1 başlık"
          value={form.processStep1Title}
          onChange={(e) => set("processStep1Title", e.target.value)}
        />
        <Textarea
          label="Adım 1 açıklama"
          textareaSize="sm"
          value={form.processStep1Description}
          onChange={(e) => set("processStep1Description", e.target.value)}
        />
        <Input
          label="Adım 2 başlık"
          value={form.processStep2Title}
          onChange={(e) => set("processStep2Title", e.target.value)}
        />
        <Textarea
          label="Adım 2 açıklama"
          textareaSize="sm"
          value={form.processStep2Description}
          onChange={(e) => set("processStep2Description", e.target.value)}
        />
        <Input
          label="Adım 3 başlık"
          value={form.processStep3Title}
          onChange={(e) => set("processStep3Title", e.target.value)}
        />
        <Textarea
          label="Adım 3 açıklama"
          textareaSize="sm"
          value={form.processStep3Description}
          onChange={(e) => set("processStep3Description", e.target.value)}
        />
        <FileUploadInput
          label="Süreç görseli"
          accept="image/*"
          purpose="HOME_PAGE_MEDIA"
          uploadUrl="/api/proxy/v1/admin/files"
          getDownloadUrl={PUBLIC_FILE_DOWNLOAD}
          value={form.processImageUrl ?? ""}
          onChange={(v) => set("processImageUrl", v)}
        />
        <Textarea
          label="Görsel alt notu"
          textareaSize="sm"
          value={form.processImageCaption ?? ""}
          onChange={(e) => set("processImageCaption", e.target.value)}
        />
      </Section>

      <Section title="Galeri">
        <Input
          label="Bölüm etiketi"
          value={form.gallerySectionLabel}
          onChange={(e) => set("gallerySectionLabel", e.target.value)}
        />
        <Input
          label="Bölüm başlığı"
          value={form.gallerySectionTitle}
          onChange={(e) => set("gallerySectionTitle", e.target.value)}
        />
        <Input
          label="CTA metni"
          value={form.gallerySectionCtaText}
          onChange={(e) => set("gallerySectionCtaText", e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["galleryImage1Url", "Galeri 1"],
              ["galleryImage2Url", "Galeri 2"],
              ["galleryImage3Url", "Galeri 3"],
              ["galleryImage4Url", "Galeri 4"],
              ["galleryImage5Url", "Galeri 5"],
              ["galleryImage6Url", "Galeri 6"],
            ] as const
          ).map(([key, label]) => (
            <FileUploadInput
              key={key}
              label={label}
              accept="image/*"
              purpose="HOME_PAGE_MEDIA"
              uploadUrl="/api/proxy/v1/admin/files"
              getDownloadUrl={PUBLIC_FILE_DOWNLOAD}
              value={form[key] ?? ""}
              onChange={(v) => set(key, v)}
            />
          ))}
        </div>
      </Section>

      <div className="flex justify-end">
        <Button variant="primary" size="md" disabled={saving} onClick={() => void save()}>
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}
