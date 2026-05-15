"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  adminUniversityApplicationsPendingTasks,
  type PendingTaskListItemDto,
} from "@/lib/api/generated/index";
import { Badge, Button, Card, CardDescription, CardTitle, Icon, Skeleton, Table } from "@/components/ui";

function formatDate(iso?: string) {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function fullName(item: Pick<PendingTaskListItemDto, "applicantFirstName" | "applicantLastName">) {
  const n = `${item.applicantFirstName ?? ""} ${item.applicantLastName ?? ""}`.trim();
  return n || "-";
}

function usePendingTasks() {
  const [data, setData] = React.useState<PendingTaskListItemDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const res = await adminUniversityApplicationsPendingTasks().catch((e: unknown) => ({
      status: 0,
      data: [] as PendingTaskListItemDto[],
      error: e instanceof Error ? e.message : "İstek başarısız",
    }));

    if (res.status >= 200 && res.status < 300) {
      setData(res.data ?? []);
    } else {
      setData([]);
      setError((res as { error?: string }).error ?? `Yüklenemedi (HTTP ${res.status})`);
    }

    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export function AdminPendingTasksClient() {
  const router = useRouter();
  const { data, loading, error, reload } = usePendingTasks();

  return (
    <Card padding="none" elevated>
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border-default)] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--warning-50)] text-[var(--warning-600)]">
            <Icon name="clock" size={16} />
          </span>
          <div>
            <CardTitle>Bekleyen Görevler</CardTitle>
            {!loading && !error && (
              <CardDescription className="mt-0.5">
                {data.length > 0
                  ? `${data.length} bekleyen görev`
                  : "Bekleyen görev yok"}
              </CardDescription>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Icon name="arrow-up-down" size={14} />}
          onClick={reload}
        >
          Yenile
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton shape="text" width="30%" />
              <Skeleton shape="text" width="20%" />
              <Skeleton shape="text" width="40%" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-5 text-sm text-[var(--danger-600)]">
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </div>
      ) : (
        <Table<PendingTaskListItemDto>
          data={data}
          rowKey={(r) => r.taskId ?? crypto.randomUUID()}
          onRowClick={(r) => {
            if (!r.applicationId) return;
            router.push(`/admin/university-applications/${encodeURIComponent(r.applicationId)}`);
          }}
          columns={[
            {
              key: "applicant",
              header: "Başvurucu",
              sortable: true,
              sortAccessor: (r) => fullName(r).toLowerCase(),
              cell: (r) => (
                <span className="font-medium text-[var(--text-primary)]">{fullName(r)}</span>
              ),
              truncate: true,
            },
            {
              key: "followerPerson",
              header: "Takip Eden",
              sortable: true,
              sortAccessor: (r) => r.followerPerson ?? "",
              cell: (r) => (
                <span className="text-[var(--text-secondary)]">{r.followerPerson ?? "-"}</span>
              ),
              width: 160,
              hideOnMobile: true,
            },
            {
              key: "withWhom",
              header: "Kimle",
              cell: (r) => (
                <span className="text-[var(--text-secondary)]">{r.withWhom ?? "-"}</span>
              ),
              width: 160,
              hideOnMobile: true,
            },
            {
              key: "whatToDo",
              header: "Yapılacak",
              cell: (r) => (
                <span className="line-clamp-2 text-[var(--text-primary)]">{r.whatToDo ?? "-"}</span>
              ),
              truncate: true,
            },
            {
              key: "scheduledAt",
              header: "Planlanan Tarih",
              sortable: true,
              sortAccessor: (r) => r.scheduledAt ?? "",
              cell: (r) => (
                <span className="tabular-nums text-[var(--text-secondary)]">
                  {formatDate(r.scheduledAt)}
                </span>
              ),
              width: 180,
              hideOnMobile: true,
            },
            {
              key: "status",
              header: "Durum",
              cell: () => (
                <Badge variant="warning" dot size="sm">
                  Bekliyor
                </Badge>
              ),
              width: 110,
            },
          ]}
          emptyTitle="Bekleyen görev yok"
          emptyDescription="Tüm görevler tamamlandı veya henüz görev oluşturulmadı."
          emptyIcon={<Icon name="check" size={18} />}
        />
      )}
    </Card>
  );
}
