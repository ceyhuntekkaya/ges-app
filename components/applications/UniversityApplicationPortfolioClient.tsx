"use client";

import * as React from "react";
import { dict, t } from "@/lib/i18n/dict";
import { FilePreview, FileUploadInput, Input } from "@/components/ui";
import { resolvePortalFilePreviewUrl } from "@/lib/files/previewUrl";
import { inferPortfolioFileType } from "@/lib/applications/portfolioFileType";
import type {
  UniversityApplicationPortfolioFileDto,
  UniversityApplicationPortfolioFileUpsertRequestDtoType,
  UniversityApplicationPortfolioSectionDto,
} from "@/lib/api/generated/index";

const FILE_TYPE_OPTIONS = [
  { value: "IMAGE", labelKey: "portfolioFileImage" },
  { value: "VIDEO", labelKey: "portfolioFileVideo" },
  { value: "AUDIO", labelKey: "portfolioFileAudio" },
  { value: "PDF", labelKey: "portfolioFilePdf" },
  { value: "LINK", labelKey: "portfolioFileLinkType" },
  { value: "OTHER", labelKey: "portfolioFileOther" },
] as const satisfies Array<{ value: UniversityApplicationPortfolioFileUpsertRequestDtoType; labelKey: string }>;

type FileDraft = {
  type: UniversityApplicationPortfolioFileUpsertRequestDtoType;
  name: string;
  description: string;
  fileUrl: string;
};

function emptyFileDraft(): FileDraft {
  return { type: "OTHER", name: "", description: "", fileUrl: "" };
}

function fileTypeLabel(lang: "tr" | "en", type?: string) {
  const opt = FILE_TYPE_OPTIONS.find((o) => o.value === type);
  return opt ? t(opt.labelKey as keyof (typeof dict)["tr"], lang) : type ?? "-";
}

export function UniversityApplicationPortfolioClient({
  applicationId,
  lang,
  sections,
  editable,
  onChanged,
}: {
  applicationId: string;
  lang: "tr" | "en";
  sections: UniversityApplicationPortfolioSectionDto[];
  editable: boolean;
  onChanged?: () => void | Promise<void>;
}) {
  const [busyKey, setBusyKey] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [addForSection, setAddForSection] = React.useState<string | null>(null);
  const [fileAddMode, setFileAddMode] = React.useState<"file" | "link">("file");
  const [fileDraft, setFileDraft] = React.useState<FileDraft>(emptyFileDraft());

  const sorted = React.useMemo(
    () => [...sections].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [sections],
  );

  async function addFile(sectionId: string) {
    if (!fileDraft.name.trim() || !fileDraft.fileUrl.trim()) {
      setError(t("portfolioFileRequired", lang));
      return;
    }
    setBusyKey(`add-${sectionId}`);
    setError(null);
    const resolvedType: UniversityApplicationPortfolioFileUpsertRequestDtoType =
      fileAddMode === "link" ? "LINK" : inferPortfolioFileType({ url: fileDraft.fileUrl, filename: fileDraft.name });
    try {
      const res = await fetch(
        `/api/proxy/v1/portal/university-applications/${encodeURIComponent(applicationId)}/portfolio-sections/${encodeURIComponent(sectionId)}/files`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            type: resolvedType,
            name: fileDraft.name.trim(),
            description: fileDraft.description.trim() || null,
            fileUrl: fileDraft.fileUrl.trim(),
          }),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAddForSection(null);
      setFileAddMode("file");
      setFileDraft(emptyFileDraft());
      await onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function deleteFile(sectionId: string, file: UniversityApplicationPortfolioFileDto) {
    if (!file.id) return;
    setBusyKey(file.id);
    setError(null);
    try {
      const res = await fetch(
        `/api/proxy/v1/portal/university-applications/${encodeURIComponent(applicationId)}/portfolio-sections/${encodeURIComponent(sectionId)}/files/${encodeURIComponent(file.id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyKey(null);
    }
  }

  if (sorted.length === 0) {
    return <p className="text-sm text-zinc-500">{t("portfolioNoSections", lang)}</p>;
  }

  return (
    <div className="grid gap-4">
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">{error}</div>
      ) : null}

      {sorted.map((section) => {
        const sectionId = section.id ? String(section.id) : "";
        const title = section.sectionNameOverride ?? section.portfolioSection?.name ?? "-";
        const description = section.sectionDescriptionOverride ?? section.portfolioSection?.description;
        const files = section.files ?? [];
        const adding = addForSection === sectionId;

        return (
          <section key={sectionId || title} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-zinc-900">
                  {title}
                  {section.required ? (
                    <span className="ml-2 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800">
                      {t("required", lang)}
                    </span>
                  ) : (
                    <span className="ml-2 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                      {t("optional", lang)}
                    </span>
                  )}
                </div>
                {description ? <p className="mt-1 text-xs text-zinc-600">{description}</p> : null}
              </div>
              {editable && sectionId ? (
                <button
                  type="button"
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-800"
                  onClick={() => {
                    setAddForSection(adding ? null : sectionId);
                    setFileAddMode("file");
                    setFileDraft(emptyFileDraft());
                  }}
                >
                  {adding ? t("cancel", lang) : t("portfolioAddFile", lang)}
                </button>
              ) : null}
            </div>

            {adding ? (
              <div className="mt-4 grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={[
                      "rounded-lg px-3 py-1.5 text-sm font-semibold",
                      fileAddMode === "file" ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white text-zinc-700",
                    ].join(" ")}
                    onClick={() => setFileAddMode("file")}
                  >
                    {t("upload", lang)}
                  </button>
                  <button
                    type="button"
                    className={[
                      "rounded-lg px-3 py-1.5 text-sm font-semibold",
                      fileAddMode === "link" ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white text-zinc-700",
                    ].join(" ")}
                    onClick={() => setFileAddMode("link")}
                  >
                    {t("portfolioFileLinkType", lang)}
                  </button>
                </div>
                <Input
                  label={t("portfolioFileName", lang)}
                  value={fileDraft.name}
                  onChange={(e) => setFileDraft((d) => ({ ...d, name: e.target.value }))}
                />
                <Input
                  label={t("portfolioFileDescription", lang)}
                  value={fileDraft.description}
                  onChange={(e) => setFileDraft((d) => ({ ...d, description: e.target.value }))}
                />
                {fileAddMode === "link" ? (
                  <Input
                    label={t("portfolioFileLink", lang)}
                    value={fileDraft.fileUrl}
                    onChange={(e) => setFileDraft((d) => ({ ...d, fileUrl: e.target.value }))}
                    placeholder="https://github.com/..."
                  />
                ) : (
                  <FileUploadInput
                    label={t("portfolioFileUpload", lang)}
                    value={fileDraft.fileUrl}
                    onChange={(v) => setFileDraft((d) => ({ ...d, fileUrl: v }))}
                    onUploaded={(meta) => {
                      const inferred = inferPortfolioFileType({
                        contentType: meta.contentType,
                        filename: meta.originalFilename,
                      });
                      setFileDraft((d) => ({
                        ...d,
                        type: inferred,
                        name: d.name.trim() ? d.name : (meta.originalFilename ?? d.name),
                      }));
                    }}
                    purpose="UNIVERSITY_APPLICATION_PORTFOLIO"
                  />
                )}
                <button
                  type="button"
                  disabled={busyKey === `add-${sectionId}`}
                  className="justify-self-start rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                  onClick={() => void addFile(sectionId)}
                >
                  {busyKey === `add-${sectionId}` ? t("creating", lang) : t("save", lang)}
                </button>
              </div>
            ) : null}

            <div className="mt-3 grid gap-3">
              {files.length === 0 ? (
                <p className="text-xs text-zinc-500">{t("notUploaded", lang)}</p>
              ) : (
                files.map((file) => {
                  const previewUrl = resolvePortalFilePreviewUrl({
                    applicationId,
                    fileUrl: file.fileUrl,
                  });
                  return (
                  <div key={String(file.id ?? file.name)} className="rounded-lg border border-zinc-200 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-900">
                          {file.name ?? fileTypeLabel(lang, file.type)}
                        </div>
                        {file.description ? <div className="mt-1 text-xs text-zinc-600">{file.description}</div> : null}
                        <div className="mt-1 text-xs text-zinc-500">{fileTypeLabel(lang, file.type)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {previewUrl ? (
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            {file.type === "LINK" ? t("portfolioOpenLink", lang) : t("view", lang)}
                          </a>
                        ) : null}
                        {editable && file.id ? (
                          <button
                            type="button"
                            disabled={busyKey === file.id}
                            onClick={() => void deleteFile(sectionId, file)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-60"
                          >
                            {busyKey === file.id ? t("deleting", lang) : t("delete", lang)}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {previewUrl && file.type !== "LINK" ? (
                      <div className="mt-3 aspect-[16/9] w-full overflow-hidden rounded-md bg-zinc-100">
                        <FilePreview
                          url={previewUrl}
                          filename={file.name ?? null}
                          fileType={file.type ?? null}
                          className="h-full w-full"
                        />
                      </div>
                    ) : null}
                  </div>
                  );
                })
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
