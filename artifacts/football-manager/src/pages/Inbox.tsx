import { useState } from "react";
import { useListInboxMessages, useMarkMessageRead, getListInboxMessagesQueryKey, getGetGameStateQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Inbox as InboxIcon, Mail, MailOpen, Star } from "lucide-react";

const categoryColors: Record<string, { bg: string; text: string }> = {
  board: { bg: "#3b82f622", text: "#60a5fa" },
  match_result: { bg: "#10b98122", text: "#34d399" },
  transfer: { bg: "#f59e0b22", text: "#fbbf24" },
  player: { bg: "#8b5cf622", text: "#a78bfa" },
  finance: { bg: "#06b6d422", text: "#22d3ee" },
  injury: { bg: "#ef444422", text: "#f87171" },
  contract: { bg: "#ec489922", text: "#f472b6" },
  media: { bg: "#84cc1622", text: "#84cc16" },
  general: { bg: "var(--fm-panel)", text: "var(--fm-muted)" },
};

export default function Inbox() {
  const { data: messages, isLoading } = useListInboxMessages();
  const markRead = useMarkMessageRead();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const handleRead = async (id: number, isRead: boolean) => {
    if (!isRead) {
      await markRead.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListInboxMessagesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
    }
    setSelectedId(id);
  };

  const filtered = (messages ?? []).filter((m: any) => filter === "all" || !m.isRead);
  const selected = messages?.find(m => m.id === selectedId);
  const unreadCount = messages?.filter(m => !m.isRead).length ?? 0;

  if (isLoading) return <div className="flex items-center justify-center h-64" style={{ color: "var(--fm-muted)" }}>Loading inbox...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="fm-section-header">
        <InboxIcon className="w-3.5 h-3.5" />
        Inbox
        {unreadCount > 0 && (
          <span className="fm-badge ml-2" style={{ background: "var(--fm-accent)", color: "#fff", fontSize: "10px" }}>{unreadCount}</span>
        )}
        <div className="ml-auto flex gap-1">
          {(["all", "unread"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className="fm-btn" style={{
              background: filter === f ? "var(--fm-accent)" : "var(--fm-panel)",
              color: filter === f ? "#fff" : "var(--fm-nav-text)",
              border: "1px solid var(--fm-border)", textTransform: "capitalize"
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Message list */}
        <div className="w-80 border-r overflow-y-auto shrink-0" style={{ borderColor: "var(--fm-border)", background: "var(--fm-panel)" }}>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs" style={{ color: "var(--fm-muted)" }}>
              {filter === "unread" ? "No unread messages." : "No messages yet."}
            </div>
          )}
          {filtered.map((m: any) => {
            const cat = categoryColors[m.type] ?? categoryColors.general;
            return (
              <div key={m.id}
                onClick={() => handleRead(m.id, m.isRead)}
                className="p-3 border-b cursor-pointer transition-all"
                style={{
                  borderColor: "var(--fm-border)",
                  background: selectedId === m.id ? "var(--fm-active-bg)" : m.isRead ? "transparent" : "var(--fm-card)",
                  borderLeft: selectedId === m.id ? "2px solid var(--fm-accent)" : "2px solid transparent",
                }}>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0">
                    {m.isRead
                      ? <MailOpen className="w-3.5 h-3.5" style={{ color: "var(--fm-muted)" }} />
                      : <Mail className="w-3.5 h-3.5" style={{ color: "var(--fm-accent)" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate" style={{ color: m.isRead ? "var(--fm-nav-text)" : "var(--fm-text)" }}>
                        {m.subject}
                      </span>
                      <span className="fm-badge shrink-0" style={{ background: cat.bg, color: cat.text, fontSize: "9px" }}>
                        {m.type}
                      </span>
                    </div>
                    <div className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--fm-muted)" }}>
                      {m.body?.substring(0, 80)}...
                    </div>
                    <div className="text-xs mt-1" style={{ color: "var(--fm-muted)", opacity: 0.6 }}>{m.date}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message detail */}
        <div className="flex-1 overflow-auto" style={{ background: "var(--fm-bg)" }}>
          {!selected && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <InboxIcon className="w-12 h-12" style={{ color: "var(--fm-border)" }} />
              <div className="text-sm" style={{ color: "var(--fm-muted)" }}>Select a message to read</div>
            </div>
          )}
          {selected && (
            <div className="p-6 max-w-2xl">
              <div className="fm-panel">
                <div className="p-4 border-b" style={{ borderColor: "var(--fm-border)" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-bold" style={{ color: "var(--fm-text)" }}>{selected.subject}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="fm-badge" style={{
                          background: (categoryColors[selected.type] ?? categoryColors.general).bg,
                          color: (categoryColors[selected.type] ?? categoryColors.general).text,
                          fontSize: "9px"
                        }}>{selected.type.toUpperCase()}</span>
                        <span className="text-xs" style={{ color: "var(--fm-muted)" }}>{selected.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--fm-text)" }}>
                    {selected.body}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
