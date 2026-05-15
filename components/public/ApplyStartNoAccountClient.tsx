"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Icon, Input, Switch } from "@/components/ui";
import { humanizeApiError } from "@/lib/api/errors";
import {
  publicLanguageCampProjectsGetActive,
  type LanguageCampProjectDetailDto,
} from "@/lib/api/generated/index";

type Category = "INDIVIDUAL" | "CORPORATE" | "FAMILY";
function formatMoney(price?: number, currency?: string) {
  if (price === undefined || price === null) return null;
  const cur = currency?.trim() || "TRY";
  try {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: cur }).format(price);
  } catch {
    return `${price} ${cur}`;
  }
}

function formatDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function categoryFromProject(p: LanguageCampProjectDetailDto): Category {
  return p.individual === false ? "CORPORATE" : "INDIVIDUAL";
}

export function ApplyStartNoAccountClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [project, setProject] = React.useState<LanguageCampProjectDetailDto | null>(null);
  const [projectLoading, setProjectLoading] = React.useState(true);
  const [projectError, setProjectError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    setProjectLoading(true);
    setProjectError(null);
    setProject(null);

    (async () => {
      try {
        const res = await publicLanguageCampProjectsGetActive(projectId);
        if (!alive) return;
        if (!res.data) {
          setProjectError("Proje bulunamadı.");
          return;
        }
        setProject(res.data);
      } catch (e) {
        if (!alive) return;
        setProjectError(humanizeApiError(e));
      } finally {
        if (alive) setProjectLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [projectId]);

  // Account
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Applicant profile
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [nationality, setNationality] = React.useState("");

  const [addrCountry, setAddrCountry] = React.useState("");
  const [addrCity, setAddrCity] = React.useState("");
  const [addrDistrict, setAddrDistrict] = React.useState("");
  const [addrLine1, setAddrLine1] = React.useState("");
  const [addrLine2, setAddrLine2] = React.useState("");
  const [addrPostal, setAddrPostal] = React.useState("");

  // Application
  const accommodationType = "PRIVATE" as const;
  const [visaNeeded, setVisaNeeded] = React.useState(false);
  const [visaFollowByGes, setVisaFollowByGes] = React.useState(false);
  const [companyCode, setCompanyCode] = React.useState("");
  const [kvkkAccepted, setKvkkAccepted] = React.useState(false);

  const [ecFullName, setEcFullName] = React.useState("");
  const [ecPhone, setEcPhone] = React.useState("");
  const [ecRelationship, setEcRelationship] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!project) {
      setError(projectError || "Proje bilgileri yüklenemedi.");
      return;
    }

    setPending(true);
    setError(null);

    const category = categoryFromProject(project);

    const payload = {
      account: { email, password },
      applicantProfile: {
        firstName,
        lastName,
        birthDate: birthDate || null,
        phone,
        nationality,
        address: {
          country: addrCountry || null,
          city: addrCity || null,
          district: addrDistrict || null,
          line1: addrLine1 || null,
          line2: addrLine2 || null,
          postalCode: addrPostal || null,
        },
      },
      application: {
        languageCampProjectId: projectId,
        category,
        accommodationType,
        visaNeeded: visaNeeded ? true : null,
        visaFollowByGes: visaFollowByGes ? true : null,
        emergencyContact:
          ecFullName || ecPhone || ecRelationship
            ? {
                fullName: ecFullName || null,
                phone: ecPhone || null,
                relationship: ecRelationship || null,
              }
            : null,
        paymentPreference: "ONE_TIME",
        companyCode: companyCode || null,
        kvkkAccepted: kvkkAccepted ? true : null,
        invoiceAddress: {
          country: null,
          city: null,
          district: null,
          line1: null,
          line2: null,
          postalCode: null,
        },
      },
    } as const;

    const res = await fetch("/api/proxy/v1/public/language-camp-applications/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => null)) as { applicationId?: string; message?: string } | null;
    if (!res.ok || !data?.applicationId) {
      setPending(false);
      setError(data?.message || `HTTP ${res.status}`);
      return;
    }

    // Auto-login so the user can see their submitted application in the portal.
    const loginRes = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!loginRes.ok) {
      setPending(false);
      setError("Başvuru alındı ama giriş yapılamadı. Lütfen giriş yapın.");
      router.push(`/login?next=/applications/language-camp/${data.applicationId}`);
      return;
    }

    router.replace(`/applications/language-camp/${data.applicationId}`);
    router.refresh();
  }

  const priceLabel = project ? formatMoney(project.price, project.currency) : null;
  const originalPriceLabel = project ? formatMoney(project.originalPrice, project.currency) : null;
  const projWindow = project
    ? [formatDate(project.projectStartAt), formatDate(project.projectEndAt)].filter(Boolean).join(" – ")
    : "";

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-16 pt-10">
      <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-7 shadow-[var(--shadow-xs)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Başvuru</div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              Hesabın yok • Başvuru
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Kullanıcı hesabı, profil ve dil kampı başvurusu tek adımda oluşturulur.
            </p>
          </div>
          <Link href={`/apply/${projectId}`} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Geri dön
          </Link>
        </div>

        {projectLoading ? (
          <div className="mt-6 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4">
            <div className="h-5 w-2/3 max-w-sm animate-pulse rounded bg-[var(--surface-2)]" />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="h-10 animate-pulse rounded bg-[var(--surface-2)]" />
              <div className="h-10 animate-pulse rounded bg-[var(--surface-2)]" />
            </div>
          </div>
        ) : project ? (
          <div className="mt-6 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4">
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Başvurulan Program</div>
            <div className="mt-1 text-base font-semibold tracking-tight text-[var(--text-primary)]">{project.title ?? "Program"}</div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              {projWindow ? (
                <div className="flex items-start gap-2 text-sm">
                  <Icon name="calendar" size={16} className="mt-0.5 shrink-0 text-[var(--text-tertiary)]" />
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">Proje Tarihleri</div>
                    <div className="text-[var(--text-secondary)]">{projWindow}</div>
                  </div>
                </div>
              ) : null}
              <div className="sm:text-right">
                <div className="text-xs font-medium text-[var(--text-tertiary)]">Fiyat</div>
                <div className="mt-0.5 flex flex-wrap items-baseline gap-2 sm:justify-end">
                  <span className="text-base font-semibold text-[var(--text-primary)]">{priceLabel ?? "Bilgi al"}</span>
                  {originalPriceLabel && originalPriceLabel !== priceLabel ? (
                    <span className="text-sm text-[var(--text-tertiary)] line-through">{originalPriceLabel}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {projectError ? (
          <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--danger-100)] bg-[var(--danger-50)] px-3.5 py-3 text-sm text-[var(--danger-700)]">
            {projectError}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 grid gap-6">
          <section className="grid gap-4">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Hesap Bilgileri</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="E-posta" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input
                label="Şifre"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint="En az 8 karakter."
              />
            </div>
          </section>

          <section className="grid gap-4">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Başvuran Profili</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Ad" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <Input label="Soyad" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
              <Input label="Doğum Tarihi" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              <Input label="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="Uyruk" value={nationality} onChange={(e) => setNationality(e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Ülke" value={addrCountry} onChange={(e) => setAddrCountry(e.target.value)} />
              <Input label="Şehir" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} />
              <Input label="İlçe" value={addrDistrict} onChange={(e) => setAddrDistrict(e.target.value)} />
              <Input label="Adres Satır 1" value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} containerClassName="sm:col-span-2" />
              <Input label="Adres Satır 2" value={addrLine2} onChange={(e) => setAddrLine2(e.target.value)} containerClassName="sm:col-span-2" />
              <Input label="Posta Kodu" value={addrPostal} onChange={(e) => setAddrPostal(e.target.value)} />
            </div>
          </section>

          <section className="grid gap-4">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Dil Kampı Başvurusu</div>
            <Input label="Şirket Kodu (ops.)" value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} />

            <div className="grid gap-3 sm:grid-cols-2">
              <Switch checked={visaNeeded} onChange={setVisaNeeded} label="Vize gerekli" />
              <Switch checked={visaFollowByGes} onChange={setVisaFollowByGes} label="Vize takibi GES tarafından yapılsın" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Acil Kişi Ad Soyad" value={ecFullName} onChange={(e) => setEcFullName(e.target.value)} />
              <Input label="Acil Kişi Telefon" value={ecPhone} onChange={(e) => setEcPhone(e.target.value)} />
              <Input label="Yakınlık" value={ecRelationship} onChange={(e) => setEcRelationship(e.target.value)} />
            </div>

            <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3">
              <Switch checked={kvkkAccepted} onChange={setKvkkAccepted} label="KVKK metnini okudum ve kabul ediyorum" />
            </div>
          </section>

          {error ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--danger-100)] bg-[var(--danger-50)] px-3.5 py-3 text-sm text-[var(--danger-700)]">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href={`/apply/${projectId}`} className="inline-flex">
              <Button variant="secondary" leftIcon={<Icon name="arrow-left" size={16} />}>
                Vazgeç
              </Button>
            </Link>
            <Button
              type="submit"
              loading={pending}
              disabled={projectLoading || !!projectError || !project}
              leftIcon={<Icon name="check" size={16} />}
            >
              {pending ? "Gönderiliyor..." : "Başvuruyu Tamamla"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

