"use client";

import * as React from "react";
import {
  languageCampAdminBase,
  type LanguageCampApplicationDetailWithCrm,
  type LanguageCampApplicationDocumentDto,
  type LanguageCampApplicationMeetingDto,
  type LanguageCampApplicationNoteDto,
  type LanguageCampApplicationTaskDto,
} from "@/lib/applications/languageCampCrmTypes";
import { formatTrDateTime } from "@/lib/dates/formatTr";
import { Badge, Button, FilePreview, Icon, Input, Modal, Select, Textarea, useToast } from "@/components/ui";
import { FileUploadInput } from "@/components/ui/FileUploadInput";

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) {
    const msg = (data as unknown as { message?: string })?.message;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data;
}

function isoLocalDateToTr(iso?: string | null): string {
  if (!iso) return "";
  const d0 = iso.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d0)) return "";
  const [y, m, d] = d0.split("-");
  return `${d}.${m}.${y}`;
}

function trDateToIso(tr: string, fieldLabel = "Tarih") {
  const s = tr.trim();
  if (!s) return { ok: false as const, message: `${fieldLabel} zorunludur.` };
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s);
  if (!m) return { ok: false as const, message: `${fieldLabel} gg.aa.yyyy formatında olmalıdır.` };
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return { ok: false as const, message: `Geçersiz ${fieldLabel.toLowerCase()}.` };
  const dt = new Date(yyyy, mm - 1, dd);
  if (dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) {
    return { ok: false as const, message: `Geçersiz ${fieldLabel.toLowerCase()}.` };
  }
  return { ok: true as const, iso: `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}` };
}

function sanitizeTrDateDigitsInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function sanitizeTrTimeDigitsInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function instantIsoToTrDateAndTime(iso?: string | null) {
  if (!iso) return { date: "", time: "" };
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return { date: "", time: "" };
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));
  const pick = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  let hour = pick("hour");
  let minute = pick("minute");
  if (/^\d$/.test(hour)) hour = `0${hour}`;
  if (/^\d$/.test(minute)) minute = `0${minute}`;
  return { date: `${pick("day")}.${pick("month")}.${pick("year")}`, time: `${hour}:${minute}` };
}

function parseTrLocalDateTimeToInstantIso(dateTr: string, timeHm: string, dateFieldLabel = "Tarih") {
  const d = trDateToIso(dateTr, dateFieldLabel);
  if (!d.ok) return d;
  const m = /^(\d{2}):(\d{2})$/.exec(timeHm.trim());
  if (!m) return { ok: false as const, message: "Saat SS:DD formatında olmalıdır." };
  const hh = Number(m[1]);
  const mi = Number(m[2]);
  if (hh < 0 || hh > 23 || mi < 0 || mi > 59) return { ok: false as const, message: "Geçersiz saat." };
  const localIso = `${d.iso}T${String(hh).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00+03:00`;
  const t = Date.parse(localIso);
  if (Number.isNaN(t)) return { ok: false as const, message: "Geçersiz tarih veya saat." };
  return { ok: true as const, iso: new Date(t).toISOString() };
}

type AccordionId = "notes" | "meetings" | "tasks" | "documents";

function AccordionItem({
  id,
  openId,
  onOpen,
  title,
  actions,
  children,
}: {
  id: AccordionId;
  openId: AccordionId;
  onOpen: (id: AccordionId) => void;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const open = openId === id;
  return (
    <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-subtle)] bg-[var(--surface-0)]">
      <div className="flex w-full items-center gap-2 px-4 py-3 sm:px-5 sm:py-4">
        <button
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] py-1 text-left text-sm font-semibold text-[var(--text-primary)] outline-none hover:bg-[var(--surface-1)]"
          onClick={() => onOpen(id)}
          aria-expanded={open}
        >
          <Icon name={open ? "chevron-down" : "chevron-right"} size={18} />
          <span>{title}</span>
        </button>
        {actions}
      </div>
      {open ? <div className="border-t border-[var(--border-subtle)] px-4 pb-4 pt-1 sm:px-5 sm:pb-5">{children}</div> : null}
    </div>
  );
}

const TASK_STATUS_OPTIONS = [
  { value: "PENDING" as const, label: "Beklemede" },
  { value: "DONE" as const, label: "Tamamlandı" },
];

export function AdminLanguageCampApplicationCrmPanels({
  applicationId,
  data,
  loading,
  onReload,
}: {
  applicationId: string;
  data: LanguageCampApplicationDetailWithCrm | null;
  loading: boolean;
  onReload: () => Promise<void>;
}) {
  const toast = useToast();
  const [busy, setBusy] = React.useState(false);
  const [openId, setOpenId] = React.useState<AccordionId>("notes");

  const [noteOpen, setNoteOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<LanguageCampApplicationNoteDto | null>(null);
  const [noteText, setNoteText] = React.useState("");

  const [meetingOpen, setMeetingOpen] = React.useState(false);
  const [editingMeeting, setEditingMeeting] = React.useState<LanguageCampApplicationMeetingDto | null>(null);
  const [meetingForm, setMeetingForm] = React.useState({
    person: "",
    meetingDate: "",
    meetingTime: "",
    meetingNote: "",
    meetingResult: "",
  });

  const [taskOpen, setTaskOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<LanguageCampApplicationTaskDto | null>(null);
  const [taskForm, setTaskForm] = React.useState({
    scheduledDate: "",
    scheduledTime: "",
    withWhom: "",
    whatToDo: "",
    status: "PENDING" as LanguageCampApplicationTaskDto["status"],
  });

  const [docOpen, setDocOpen] = React.useState(false);
  const [editingDoc, setEditingDoc] = React.useState<LanguageCampApplicationDocumentDto | null>(null);
  const [docForm, setDocForm] = React.useState({
    required: false,
    documentName: "",
    documentDescription: "",
    documentUrl: "",
  });

  const base = languageCampAdminBase(applicationId);

  const submitNote = async () => {
    if (!data?.id) return;
    setBusy(true);
    try {
      if (editingNote?.id) {
        await apiJson(`${base}/notes/${encodeURIComponent(editingNote.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ todoText: noteText }),
        });
        toast.success({ title: "Güncellendi", description: "Not güncellendi." });
      } else {
        await apiJson(`${base}/notes`, { method: "POST", body: JSON.stringify({ todoText: noteText }) });
        toast.success({ title: "Eklendi", description: "Not eklendi." });
      }
      setNoteOpen(false);
      await onReload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "İşlem başarısız" });
    } finally {
      setBusy(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    setBusy(true);
    try {
      await apiJson(`${base}/notes/${encodeURIComponent(noteId)}`, { method: "DELETE" });
      toast.success({ title: "Silindi", description: "Not silindi." });
      await onReload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "Silinemedi" });
    } finally {
      setBusy(false);
    }
  };

  const submitMeeting = async () => {
    if (!data?.id) return;
    setBusy(true);
    try {
      const person = meetingForm.person.trim();
      if (!person) {
        toast.error({ title: "Eksik bilgi", description: "Kişi alanı zorunludur." });
        setBusy(false);
        return;
      }
      const when = parseTrLocalDateTimeToInstantIso(meetingForm.meetingDate, meetingForm.meetingTime, "Görüşme tarihi");
      if (!when.ok) {
        toast.error({ title: "Geçersiz tarih/saat", description: when.message });
        setBusy(false);
        return;
      }
      const body = JSON.stringify({
        person,
        meetingAt: when.iso,
        meetingNote: meetingForm.meetingNote.trim() || null,
        meetingResult: meetingForm.meetingResult.trim() || null,
      });
      if (editingMeeting?.id) {
        await apiJson(`${base}/meetings/${encodeURIComponent(editingMeeting.id)}`, { method: "PATCH", body });
      } else {
        await apiJson(`${base}/meetings`, { method: "POST", body });
      }
      setMeetingOpen(false);
      await onReload();
      toast.success({ title: "Kaydedildi", description: "Görüşme kaydedildi." });
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "İşlem başarısız" });
    } finally {
      setBusy(false);
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    setBusy(true);
    try {
      await apiJson(`${base}/meetings/${encodeURIComponent(meetingId)}`, { method: "DELETE" });
      toast.success({ title: "Silindi", description: "Görüşme silindi." });
      await onReload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "Silinemedi" });
    } finally {
      setBusy(false);
    }
  };

  const submitTask = async () => {
    if (!data?.id) return;
    setBusy(true);
    try {
      if (!taskForm.whatToDo.trim() || !taskForm.withWhom.trim()) {
        toast.error({ title: "Eksik bilgi", description: "Ne yapılacak ve Kiminle alanları zorunludur." });
        setBusy(false);
        return;
      }
      const when = parseTrLocalDateTimeToInstantIso(taskForm.scheduledDate, taskForm.scheduledTime, "Görev tarihi");
      if (!when.ok) {
        toast.error({ title: "Geçersiz tarih/saat", description: when.message });
        setBusy(false);
        return;
      }
      const body = JSON.stringify({
        scheduledAt: when.iso,
        withWhom: taskForm.withWhom.trim(),
        whatToDo: taskForm.whatToDo.trim(),
        status: taskForm.status || null,
      });
      if (editingTask?.id) {
        await apiJson(`${base}/tasks/${encodeURIComponent(editingTask.id)}`, { method: "PATCH", body });
      } else {
        await apiJson(`${base}/tasks`, { method: "POST", body });
      }
      setTaskOpen(false);
      await onReload();
      toast.success({ title: "Kaydedildi", description: "Görev kaydedildi." });
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "İşlem başarısız" });
    } finally {
      setBusy(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    setBusy(true);
    try {
      await apiJson(`${base}/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
      toast.success({ title: "Silindi", description: "Görev silindi." });
      await onReload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "Silinemedi" });
    } finally {
      setBusy(false);
    }
  };

  const submitDoc = async () => {
    if (!data?.id) return;
    setBusy(true);
    try {
      const body = JSON.stringify({
        required: docForm.required,
        documentName: docForm.documentName,
        documentDescription: docForm.documentDescription || null,
        documentUrl: docForm.documentUrl || null,
      });
      if (editingDoc?.id) {
        await apiJson(`${base}/documents/${encodeURIComponent(editingDoc.id)}`, { method: "PATCH", body });
      } else {
        await apiJson(`${base}/documents`, { method: "POST", body });
      }
      setDocOpen(false);
      await onReload();
      toast.success({ title: "Kaydedildi", description: "Doküman kaydedildi." });
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "İşlem başarısız" });
    } finally {
      setBusy(false);
    }
  };

  const deleteDoc = async (docId: string) => {
    setBusy(true);
    try {
      await apiJson(`${base}/documents/${encodeURIComponent(docId)}`, { method: "DELETE" });
      toast.success({ title: "Silindi", description: "Doküman silindi." });
      await onReload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "Silinemedi" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AccordionItem
        id="notes"
        openId={openId}
        onOpen={setOpenId}
        title="Notlar"
        actions={
          <Button size="sm" variant="secondary" disabled={!data || loading} onClick={() => {
            setOpenId("notes");
            setEditingNote(null);
            setNoteText("");
            setNoteOpen(true);
          }}>
            Ekle
          </Button>
        }
      >
        {data?.applicationNotes?.length ? (
          <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
            {data.applicationNotes.map((n) => (
              <li key={String(n.id)} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-[var(--text-primary)]">{n.todoText ?? "-"}</div>
                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                      {n.writtenBy ?? "-"} • {formatTrDateTime(n.writtenAt)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => {
                      setEditingNote(n);
                      setNoteText(n.todoText ?? "");
                      setNoteOpen(true);
                    }}>
                      Düzenle
                    </Button>
                    {n.id ? (
                      <Button size="sm" variant="danger" disabled={busy} onClick={() => void deleteNote(n.id!)}>
                        Sil
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-[var(--text-tertiary)]">Kayıt yok</div>
        )}
      </AccordionItem>

      <AccordionItem
        id="meetings"
        openId={openId}
        onOpen={setOpenId}
        title="Görüşmeler"
        actions={
          <Button size="sm" variant="secondary" disabled={!data || loading} onClick={() => {
            setOpenId("meetings");
            setEditingMeeting(null);
            setMeetingForm({ person: "", meetingDate: "", meetingTime: "", meetingNote: "", meetingResult: "" });
            setMeetingOpen(true);
          }}>
            Ekle
          </Button>
        }
      >
        {data?.meetings?.length ? (
          <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
            {data.meetings.map((m) => (
              <li key={String(m.id)} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)]">{m.person ?? "-"}</div>
                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">{formatTrDateTime(m.meetingAt)}</div>
                    {m.meetingNote ? <div className="mt-1 text-xs text-[var(--text-tertiary)]">{m.meetingNote}</div> : null}
                    {m.meetingResult ? <div className="mt-1 text-xs text-[var(--text-tertiary)]">Sonuç: {m.meetingResult}</div> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => {
                      setEditingMeeting(m);
                      const dt = instantIsoToTrDateAndTime(m.meetingAt);
                      setMeetingForm({
                        person: m.person ?? "",
                        meetingDate: dt.date,
                        meetingTime: dt.time,
                        meetingNote: m.meetingNote ?? "",
                        meetingResult: m.meetingResult ?? "",
                      });
                      setMeetingOpen(true);
                    }}>
                      Düzenle
                    </Button>
                    {m.id ? (
                      <Button size="sm" variant="danger" disabled={busy} onClick={() => void deleteMeeting(m.id!)}>
                        Sil
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-[var(--text-tertiary)]">Kayıt yok</div>
        )}
      </AccordionItem>

      <AccordionItem
        id="tasks"
        openId={openId}
        onOpen={setOpenId}
        title="Görevler"
        actions={
          <Button size="sm" variant="secondary" disabled={!data || loading} onClick={() => {
            setOpenId("tasks");
            setEditingTask(null);
            setTaskForm({ scheduledDate: "", scheduledTime: "", withWhom: "", whatToDo: "", status: "PENDING" });
            setTaskOpen(true);
          }}>
            Ekle
          </Button>
        }
      >
        {data?.tasks?.length ? (
          <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
            {data.tasks.map((t) => (
              <li key={String(t.id)} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)]">{t.whatToDo ?? "-"}</div>
                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                      {formatTrDateTime(t.scheduledAt)} • {t.status === "DONE" ? "Tamamlandı" : "Beklemede"}
                    </div>
                    {t.withWhom ? <div className="mt-1 text-xs text-[var(--text-tertiary)]">Kiminle: {t.withWhom}</div> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => {
                      setEditingTask(t);
                      const dt = instantIsoToTrDateAndTime(t.scheduledAt);
                      setTaskForm({
                        scheduledDate: dt.date,
                        scheduledTime: dt.time,
                        withWhom: t.withWhom ?? "",
                        whatToDo: t.whatToDo ?? "",
                        status: t.status ?? "PENDING",
                      });
                      setTaskOpen(true);
                    }}>
                      Düzenle
                    </Button>
                    {t.id ? (
                      <Button size="sm" variant="danger" disabled={busy} onClick={() => void deleteTask(t.id!)}>
                        Sil
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-[var(--text-tertiary)]">Kayıt yok</div>
        )}
      </AccordionItem>

      <AccordionItem
        id="documents"
        openId={openId}
        onOpen={setOpenId}
        title="Dokümanlar"
        actions={
          <Button size="sm" variant="secondary" disabled={!data || loading} onClick={() => {
            setOpenId("documents");
            setEditingDoc(null);
            setDocForm({ required: false, documentName: "", documentDescription: "", documentUrl: "" });
            setDocOpen(true);
          }}>
            Ekle
          </Button>
        }
      >
        {data?.documents?.length ? (
          <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
            {data.documents.map((d) => (
              <li key={String(d.id)} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {d.documentName ?? "Doküman"}
                      {d.required ? <span className="ml-2 text-xs text-[var(--danger-600)]">zorunlu</span> : null}
                    </div>
                    {d.documentDescription ? (
                      <div className="mt-1 text-xs text-[var(--text-tertiary)]">{d.documentDescription}</div>
                    ) : null}
                    {d.documentUrl ? (
                      <div className="mt-2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-2">
                        <FilePreview url={d.documentUrl} filename={d.documentName ?? null} className="aspect-[16/9] w-full max-w-md" />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => {
                      setEditingDoc(d);
                      setDocForm({
                        required: !!d.required,
                        documentName: d.documentName ?? "",
                        documentDescription: d.documentDescription ?? "",
                        documentUrl: d.documentUrl ?? "",
                      });
                      setDocOpen(true);
                    }}>
                      Düzenle
                    </Button>
                    {d.id ? (
                      <Button size="sm" variant="danger" disabled={busy} onClick={() => void deleteDoc(d.id!)}>
                        Sil
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-[var(--text-tertiary)]">Kayıt yok</div>
        )}
      </AccordionItem>

      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title={editingNote ? "Not Güncelle" : "Not Ekle"} footer={
        <>
          <Button variant="secondary" onClick={() => setNoteOpen(false)} disabled={busy}>Vazgeç</Button>
          <Button onClick={() => void submitNote()} loading={busy}>Kaydet</Button>
        </>
      }>
        <Textarea label="Not metni" value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} />
      </Modal>

      <Modal open={meetingOpen} onClose={() => setMeetingOpen(false)} title={editingMeeting ? "Görüşme Güncelle" : "Görüşme Ekle"} size="lg" footer={
        <>
          <Button variant="secondary" onClick={() => setMeetingOpen(false)} disabled={busy}>Vazgeç</Button>
          <Button onClick={() => void submitMeeting()} loading={busy}>Kaydet</Button>
        </>
      }>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Input label="Kişi" required value={meetingForm.person} onChange={(e) => setMeetingForm((s) => ({ ...s, person: e.target.value }))} /></div>
          <Input label="Tarih" required inputMode="numeric" value={meetingForm.meetingDate} onChange={(e) => setMeetingForm((s) => ({ ...s, meetingDate: sanitizeTrDateDigitsInput(e.target.value) }))} placeholder="gg.aa.yyyy" />
          <Input label="Saat" required inputMode="numeric" value={meetingForm.meetingTime} onChange={(e) => setMeetingForm((s) => ({ ...s, meetingTime: sanitizeTrTimeDigitsInput(e.target.value) }))} placeholder="SS:DD" />
          <div className="sm:col-span-2"><Textarea label="Görüşme notu" value={meetingForm.meetingNote} onChange={(e) => setMeetingForm((s) => ({ ...s, meetingNote: e.target.value }))} rows={3} /></div>
          <div className="sm:col-span-2"><Textarea label="Sonuç" value={meetingForm.meetingResult} onChange={(e) => setMeetingForm((s) => ({ ...s, meetingResult: e.target.value }))} rows={2} /></div>
        </div>
      </Modal>

      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title={editingTask ? "Görev Güncelle" : "Görev Ekle"} size="lg" footer={
        <>
          <Button variant="secondary" onClick={() => setTaskOpen(false)} disabled={busy}>Vazgeç</Button>
          <Button onClick={() => void submitTask()} loading={busy}>Kaydet</Button>
        </>
      }>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Input label="Ne yapılacak?" required value={taskForm.whatToDo} onChange={(e) => setTaskForm((s) => ({ ...s, whatToDo: e.target.value }))} /></div>
          <Input label="Tarih" required inputMode="numeric" value={taskForm.scheduledDate} onChange={(e) => setTaskForm((s) => ({ ...s, scheduledDate: sanitizeTrDateDigitsInput(e.target.value) }))} placeholder="gg.aa.yyyy" />
          <Input label="Saat" required inputMode="numeric" value={taskForm.scheduledTime} onChange={(e) => setTaskForm((s) => ({ ...s, scheduledTime: sanitizeTrTimeDigitsInput(e.target.value) }))} placeholder="SS:DD" />
          <div className="sm:col-span-2"><Input label="Kiminle" required value={taskForm.withWhom} onChange={(e) => setTaskForm((s) => ({ ...s, withWhom: e.target.value }))} /></div>
          <Select label="Durum" value={taskForm.status ?? "PENDING"} onChange={(v) => setTaskForm((s) => ({ ...s, status: v ?? "PENDING" }))} options={TASK_STATUS_OPTIONS} />
        </div>
      </Modal>

      <Modal open={docOpen} onClose={() => setDocOpen(false)} title={editingDoc ? "Doküman Güncelle" : "Doküman Ekle"} size="lg" footer={
        <>
          <Button variant="secondary" onClick={() => setDocOpen(false)} disabled={busy}>Vazgeç</Button>
          <Button onClick={() => void submitDoc()} loading={busy}>Kaydet</Button>
        </>
      }>
        <div className="grid gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={docForm.required} onChange={(e) => setDocForm((s) => ({ ...s, required: e.target.checked }))} />
            Zorunlu
          </label>
          <Input label="Belge adı" required value={docForm.documentName} onChange={(e) => setDocForm((s) => ({ ...s, documentName: e.target.value }))} />
          <Textarea label="Açıklama" value={docForm.documentDescription} onChange={(e) => setDocForm((s) => ({ ...s, documentDescription: e.target.value }))} rows={2} />
          <FileUploadInput
            label="Dosya"
            value={docForm.documentUrl}
            onChange={(v) => setDocForm((s) => ({ ...s, documentUrl: v }))}
            purpose="LANGUAGE_CAMP_APPLICATION"
            uploadUrl="/api/proxy/v1/admin/files"
            getDownloadUrl={(fileId) => `/api/proxy/v1/admin/files/${encodeURIComponent(fileId)}/download`}
          />
        </div>
      </Modal>
    </>
  );
}
