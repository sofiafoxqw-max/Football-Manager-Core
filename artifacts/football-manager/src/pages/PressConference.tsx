import { useState } from "react";
import { useGetPressConference, useAnswerPressConference, useGiveTeamTalk } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Mic, MessageSquare, Users } from "lucide-react";

export default function PressConference() {
  const { data: press } = useGetPressConference();
  const answerPress = useAnswerPressConference();
  const giveTeamTalk = useGiveTeamTalk();
  const qc = useQueryClient();

  const [tab, setTab] = useState<"press" | "teamtalk">("press");
  const [answered, setAnswered] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, { moraleEffect: string; message: string }>>({});
  const [talkTone, setTalkTone] = useState("encourage");
  const [talkTiming, setTalkTiming] = useState("pre_match");
  const [talkResult, setTalkResult] = useState<any>(null);

  const handleAnswer = async (questionId: number, optionId: string) => {
    setAnswered(prev => ({ ...prev, [questionId]: optionId }));
    const res = await answerPress.mutateAsync({ data: { questionId, optionId } });
    setFeedback(prev => ({ ...prev, [questionId]: res as any }));
  };

  const handleTeamTalk = async () => {
    const res = await giveTeamTalk.mutateAsync({ data: { tone: talkTone as any, timing: talkTiming as any } });
    setTalkResult(res);
    setTimeout(() => setTalkResult(null), 5000);
  };

  const moraleColors: Record<string, string> = { positive: "#10b981", neutral: "#f59e0b", negative: "#ef4444" };
  const toneColors: Record<string, string> = {
    encourage: "#3b82f6", praise: "#10b981", demand: "#f59e0b",
    calm: "#06b6d4", motivate: "#8b5cf6", warning: "#ef4444",
  };

  const tones = ["encourage", "praise", "motivate", "calm", "demand", "warning"];
  const timings = ["pre_match", "half_time", "post_match_win", "post_match_draw", "post_match_loss"];

  return (
    <div className="h-full flex flex-col">
      <div className="fm-section-header">
        <Mic className="w-3.5 h-3.5" />
        Media & Team Management
        <div className="ml-auto flex gap-1">
          {(["press", "teamtalk"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="fm-btn" style={{
              background: tab === t ? "var(--fm-accent)" : "var(--fm-panel)",
              color: tab === t ? "#fff" : "var(--fm-nav-text)",
              border: "1px solid var(--fm-border)"
            }}>
              {t === "press" ? "Press Conference" : "Team Talk"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab === "press" && (
          <div className="max-w-2xl space-y-4">
            {press?.opponentName && (
              <div className="fm-card p-3">
                <div className="text-xs" style={{ color: "var(--fm-muted)" }}>PRE-MATCH PRESS CONFERENCE</div>
                <div className="text-sm font-semibold mt-1" style={{ color: "var(--fm-text)" }}>
                  Ahead of: vs {press.opponentName}
                </div>
              </div>
            )}

            {press?.questions?.map(q => (
              <div key={q.id} className="fm-panel">
                <div className="p-3 border-b" style={{ borderColor: "var(--fm-border)" }}>
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--fm-accent)" }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--fm-text)" }}>{q.question}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--fm-muted)" }}>{q.context}</div>
                    </div>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {q.options.map(opt => {
                    const isSelected = answered[q.id] === opt.id;
                    const fb = feedback[q.id];
                    return (
                      <button key={opt.id} disabled={!!answered[q.id]}
                        onClick={() => handleAnswer(q.id, opt.id)}
                        className="w-full text-left p-2.5 rounded text-sm transition-all"
                        style={{
                          background: isSelected
                            ? (fb ? moraleColors[fb.moraleEffect] + "22" : "var(--fm-active-bg)")
                            : "var(--fm-panel)",
                          border: `1px solid ${isSelected ? (fb ? moraleColors[fb.moraleEffect] : "var(--fm-accent)") : "var(--fm-border)"}`,
                          color: isSelected ? "var(--fm-text)" : "var(--fm-nav-text)",
                          cursor: answered[q.id] ? "default" : "pointer",
                          opacity: answered[q.id] && !isSelected ? 0.4 : 1,
                        }}>
                        <div className="flex items-center justify-between">
                          <span>"{opt.text}"</span>
                          <span className="fm-badge ml-2 shrink-0" style={{
                            background: toneColors[opt.tone] + "22",
                            color: toneColors[opt.tone],
                            fontSize: "9px",
                            textTransform: "uppercase",
                          }}>{opt.tone}</span>
                        </div>
                      </button>
                    );
                  })}
                  {feedback[q.id] && (
                    <div className="p-2 rounded text-xs mt-1" style={{
                      background: moraleColors[feedback[q.id].moraleEffect] + "15",
                      border: `1px solid ${moraleColors[feedback[q.id].moraleEffect]}33`,
                      color: moraleColors[feedback[q.id].moraleEffect],
                    }}>
                      {feedback[q.id].message}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {!press?.questions?.length && (
              <div className="fm-panel p-8 text-center" style={{ color: "var(--fm-muted)" }}>
                No press conference scheduled at the moment.
              </div>
            )}
          </div>
        )}

        {tab === "teamtalk" && (
          <div className="max-w-lg space-y-4">
            <div className="fm-panel">
              <div className="p-3 border-b" style={{ borderColor: "var(--fm-border)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--fm-text)" }}>TEAM TALK</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--fm-muted)" }}>Your words can inspire or deflate the squad. Choose carefully.</div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs mb-2 block" style={{ color: "var(--fm-muted)" }}>TIMING</label>
                  <div className="grid grid-cols-3 gap-1">
                    {timings.map(t => (
                      <button key={t} onClick={() => setTalkTiming(t)} className="fm-btn text-xs"
                        style={{
                          background: talkTiming === t ? "var(--fm-accent)" : "var(--fm-panel)",
                          color: talkTiming === t ? "#fff" : "var(--fm-muted)",
                          border: "1px solid var(--fm-border)",
                          textTransform: "capitalize",
                          justifyContent: "center",
                        }}>
                        {t.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-2 block" style={{ color: "var(--fm-muted)" }}>TONE</label>
                  <div className="grid grid-cols-3 gap-2">
                    {tones.map(tone => (
                      <button key={tone} onClick={() => setTalkTone(tone)}
                        className="p-3 rounded text-sm transition-all"
                        style={{
                          background: talkTone === tone ? toneColors[tone] + "33" : "var(--fm-panel)",
                          border: `1px solid ${talkTone === tone ? toneColors[tone] : "var(--fm-border)"}`,
                          color: talkTone === tone ? toneColors[tone] : "var(--fm-muted)",
                          textTransform: "capitalize",
                          fontWeight: talkTone === tone ? "600" : "400",
                        }}>
                        <div className="text-lg mb-1">
                          {tone === "encourage" ? "💪" : tone === "praise" ? "🌟" : tone === "motivate" ? "🔥" :
                           tone === "calm" ? "🧘" : tone === "demand" ? "⚡" : "⚠️"}
                        </div>
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="fm-btn fm-btn-primary w-full justify-center" onClick={handleTeamTalk}
                  disabled={giveTeamTalk.isPending}>
                  <Users className="w-4 h-4" />
                  {giveTeamTalk.isPending ? "Delivering..." : "Give Team Talk"}
                </button>

                {talkResult && (
                  <div className="p-3 rounded" style={{
                    background: moraleColors[talkResult.moraleEffect] + "15",
                    border: `1px solid ${moraleColors[talkResult.moraleEffect]}33`,
                  }}>
                    <div className="text-sm font-medium mb-1" style={{ color: moraleColors[talkResult.moraleEffect] }}>
                      {talkResult.moraleEffect === "positive" ? "✓ Positive Effect" : talkResult.moraleEffect === "negative" ? "✗ Negative Effect" : "Neutral Effect"}
                    </div>
                    <div className="text-xs" style={{ color: "var(--fm-text)" }}>{talkResult.message}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--fm-muted)" }}>
                      Affected {talkResult.affectedPlayers} player{talkResult.affectedPlayers !== 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
