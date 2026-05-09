"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Icon, Input, Select, Switch } from "@/components/ui";

type Category = "INDIVIDUAL" | "CORPORATE" | "FAMILY";
type AccommodationType = "HOST_FAMILY" | "DORMITORY" | "PRIVATE";
type PaymentPreference = "ONE_TIME" | "INSTALLMENT";

const CATEGORY_OPTIONS = [
  { value: "INDIVIDUAL", label: "Bireysel" },
  { value: "CORPORATE", label: "Kurumsal" },
  { value: "FAMILY", label: "Aile" },
] as const;

const ACCOMMODATION_OPTIONS = [
  { value: "HOST_FAMILY", label: "Aile Yanı" },
  { value: "DORMITORY", label: "Yurt" },
  { value: "PRIVATE", label: "Özel" },
] as const;

const PAYMENT_OPTIONS = [
  { value: "ONE_TIME", label: "Tek Çekim" },
  { value: "INSTALLMENT", label: "Taksit" },
] as const;

export function ApplyStartNoAccountClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
  const [category, setCategory] = React.useState<Category>("INDIVIDUAL");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [accommodationType, setAccommodationType] = React.useState<AccommodationType | "">("");
  const [visaNeeded, setVisaNeeded] = React.useState(false);
  const [visaFollowByGes, setVisaFollowByGes] = React.useState(false);
  const [paymentPreference, setPaymentPreference] = React.useState<PaymentPreference | "">("");
  const [companyCode, setCompanyCode] = React.useState("");
  const [kvkkAccepted, setKvkkAccepted] = React.useState(false);

  const [ecFullName, setEcFullName] = React.useState("");
  const [ecPhone, setEcPhone] = React.useState("");
  const [ecRelationship, setEcRelationship] = React.useState("");

  const [invCountry, setInvCountry] = React.useState("");
  const [invCity, setInvCity] = React.useState("");
  const [invDistrict, setInvDistrict] = React.useState("");
  const [invLine1, setInvLine1] = React.useState("");
  const [invLine2, setInvLine2] = React.useState("");
  const [invPostal, setInvPostal] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

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
        category,
        startDate: startDate || null,
        endDate: endDate || null,
        accommodationType: accommodationType || null,
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
        paymentPreference: paymentPreference || null,
        companyCode: companyCode || null,
        kvkkAccepted: kvkkAccepted ? true : null,
        invoiceAddress: {
          country: invCountry || null,
          city: invCity || null,
          district: invDistrict || null,
          line1: invLine1 || null,
          line2: invLine2 || null,
          postalCode: invPostal || null,
        },
      },
      // projectId is currently only used for routing context; backend doesn't map it yet.
      projectId,
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

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-16 pt-10">
      <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-7 shadow-[var(--shadow-xs)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Başvuru</div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              Hesabın yok • Tek Seferde Başvuru
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Kullanıcı hesabı, profil ve dil kampı başvurusu tek adımda oluşturulur.
            </p>
          </div>
          <Link href={`/apply/${projectId}`} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Geri dön
          </Link>
        </div>

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
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Kategori"
                required
                options={CATEGORY_OPTIONS as unknown as { value: string; label: string }[]}
                value={category}
                onChange={(v) => setCategory((v as Category) ?? "INDIVIDUAL")}
              />
              <Input label="Başlangıç Tarihi" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input label="Bitiş Tarihi" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <Select
                label="Konaklama"
                options={ACCOMMODATION_OPTIONS as unknown as { value: string; label: string }[]}
                value={accommodationType || null}
                onChange={(v) => setAccommodationType((v as AccommodationType) ?? "")}
                placeholder="Seçin"
                clearable
              />
              <Select
                label="Ödeme Tercihi"
                options={PAYMENT_OPTIONS as unknown as { value: string; label: string }[]}
                value={paymentPreference || null}
                onChange={(v) => setPaymentPreference((v as PaymentPreference) ?? "")}
                placeholder="Seçin"
                clearable
              />
              <Input label="Şirket Kodu (ops.)" value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Switch checked={visaNeeded} onChange={setVisaNeeded} label="Vize gerekli" />
              <Switch checked={visaFollowByGes} onChange={setVisaFollowByGes} label="Vize takibi GES tarafından yapılsın" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Acil Kişi Ad Soyad" value={ecFullName} onChange={(e) => setEcFullName(e.target.value)} />
              <Input label="Acil Kişi Telefon" value={ecPhone} onChange={(e) => setEcPhone(e.target.value)} />
              <Input label="Yakınlık" value={ecRelationship} onChange={(e) => setEcRelationship(e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Fatura Ülke" value={invCountry} onChange={(e) => setInvCountry(e.target.value)} />
              <Input label="Fatura Şehir" value={invCity} onChange={(e) => setInvCity(e.target.value)} />
              <Input label="Fatura İlçe" value={invDistrict} onChange={(e) => setInvDistrict(e.target.value)} />
              <Input label="Fatura Adres 1" value={invLine1} onChange={(e) => setInvLine1(e.target.value)} containerClassName="sm:col-span-2" />
              <Input label="Fatura Adres 2" value={invLine2} onChange={(e) => setInvLine2(e.target.value)} containerClassName="sm:col-span-2" />
              <Input label="Fatura Posta Kodu" value={invPostal} onChange={(e) => setInvPostal(e.target.value)} />
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
            <Button type="submit" loading={pending} leftIcon={<Icon name="check" size={16} />}>
              {pending ? "Gönderiliyor..." : "Başvuruyu Tamamla"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

