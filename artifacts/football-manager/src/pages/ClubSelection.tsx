import { useFmListClubs, useSetupGame, getGetGameStateQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ChevronDown, Trophy, Target, Zap, Users, BarChart2, Shield } from "lucide-react";

const FEATURES = [
  { icon: Trophy, title: "Полный сезон", desc: "38 матчей Премьер-лиги — борьба за чемпионство, еврокубки или выживание." },
  { icon: Target, title: "Тактический контроль", desc: "Формации, стандарты, прессинг, стиль игры — настрой всё под свой стиль." },
  { icon: Zap, title: "Живые матчи", desc: "Подробный комментарий, рейтинги игроков и смена momentum в реальном времени." },
  { icon: Users, title: "Управление составом", desc: "Контракты, травмы, моральный дух — держи всю команду в тонусе." },
  { icon: BarChart2, title: "Трансферный рынок", desc: "Покупай, продавай, отдавай в аренду. Собирай команду мечты в рамках бюджета." },
  { icon: Shield, title: "Персонал и тренировки", desc: "Нанимай тренеров, физиотерапевтов и аналитиков. Выходи на пик в нужный момент." },
];

const STATS = [
  { value: "20", label: "Клубов Премьер-лиги" },
  { value: "500+", label: "Игроков" },
  { value: "38", label: "Туров" },
  { value: "∞", label: "Карьерных путей" },
];

function tierBadge(prestige: number) {
  if (prestige >= 5) return { label: "Элита", color: "#f59e0b" };
  if (prestige >= 4) return { label: "Топ-клуб", color: "#60a5fa" };
  if (prestige >= 3) return { label: "Середняк", color: "#34d399" };
  return { label: "Новичок", color: "#94a3b8" };
}

function PrestigeStars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < n ? "#f59e0b" : "#1e2d42", fontSize: 13 }}>★</span>
      ))}
    </div>
  );
}

export default function ClubSelection() {
  const { data: clubs, isLoading } = useFmListClubs();
  const setupGame = useSetupGame();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<"hero" | "select">("hero");
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [managerName, setManagerName] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const handleStart = async () => {
    if (!selectedClub || !managerName.trim()) {
      setError("Выбери клуб и введи имя менеджера.");
      return;
    }
    setStarting(true);
    setError("");
    try {
      await setupGame.mutateAsync({ data: { clubId: selectedClub.id, managerName: managerName.trim() } });
      queryClient.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
      setLocation("/dashboard");
    } catch {
      setError("Не удалось начать игру. Попробуй ещё раз.");
      setStarting(false);
    }
  };

  const filtered = clubs?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#080c14" }}>
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto font-black" style={{ background: "#3b82f6" }}>FM</div>
        <div style={{ color: "#4a6080", fontSize: 13 }}>Загрузка…</div>
      </div>
    </div>
  );

  return (
    <div style={{ background: "#080c14", minHeight: "100vh", color: "#d1d9e6", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ── HERO ── */}
      {phase === "hero" && (
        <div style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Animated pitch lines background */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }} viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
            <rect x="100" y="50" width="1000" height="600" fill="none" stroke="#3b82f6" strokeWidth="2" />
            <circle cx="600" cy="350" r="90" fill="none" stroke="#3b82f6" strokeWidth="2" />
            <line x1="600" y1="50" x2="600" y2="650" stroke="#3b82f6" strokeWidth="2" />
            <rect x="100" y="250" width="180" height="200" fill="none" stroke="#3b82f6" strokeWidth="2" />
            <rect x="920" y="250" width="180" height="200" fill="none" stroke="#3b82f6" strokeWidth="2" />
            <rect x="100" y="300" width="60" height="100" fill="none" stroke="#3b82f6" strokeWidth="2" />
            <rect x="1040" y="300" width="60" height="100" fill="none" stroke="#3b82f6" strokeWidth="2" />
            <circle cx="100" cy="350" r="8" fill="#3b82f6" />
            <circle cx="1100" cy="350" r="8" fill="#3b82f6" />
            <circle cx="600" cy="350" r="8" fill="#3b82f6" />
          </svg>

          {/* Radial glow */}
          <div style={{
            position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
            width: 700, height: 700, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* Nav */}
          <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#fff" }}>FM</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#d1d9e6" }}>Football Manager</div>
                <div style={{ fontSize: 11, color: "#4a6080" }}>Сезон 2025/26</div>
              </div>
            </div>
            <button
              onClick={() => setPhase("select")}
              style={{ background: "transparent", border: "1px solid #1e2d42", borderRadius: 6, padding: "8px 20px", color: "#8aa4c8", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
              Начать →
            </button>
          </nav>

          {/* Hero content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px", position: "relative", zIndex: 10 }}>

            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, background: "#0e1a2e", border: "1px solid #1e2d42",
              borderRadius: 20, padding: "6px 16px", fontSize: 12, color: "#3b82f6", fontWeight: 600, marginBottom: 32, letterSpacing: "0.05em"
            }}>
              ⚽ PREMIER LEAGUE 2025/26
            </div>

            <h1 style={{ fontSize: "clamp(42px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.05, marginBottom: 24, letterSpacing: "-0.03em" }}>
              <span style={{ color: "#d1d9e6" }}>Твой клуб.</span><br />
              <span style={{ color: "#3b82f6" }}>Твои правила.</span><br />
              <span style={{ color: "#d1d9e6" }}>Твоя слава.</span>
            </h1>

            <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "#4a6080", maxWidth: 560, lineHeight: 1.7, marginBottom: 40 }}>
              Займи место на скамейке запасных, выстрой свою тактику и веди клуб Премьер-лиги от предсезонки до чемпионства — или борись до последнего за выживание.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={() => setPhase("select")}
                style={{
                  background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8,
                  padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  boxShadow: "0 0 32px rgba(59,130,246,0.35)"
                }}>
                Выбрать клуб <ChevronRight size={18} />
              </button>
            </div>

            {/* Stats strip */}
            <div style={{ display: "flex", gap: "clamp(24px, 5vw, 64px)", marginTop: 64, flexWrap: "wrap", justifyContent: "center" }}>
              {STATS.map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "#d1d9e6", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#4a6080", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll hint */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 32, gap: 6, position: "relative", zIndex: 10 }}>
            <span style={{ fontSize: 11, color: "#4a6080", letterSpacing: "0.1em" }}>ПРОКРУТИ ВНИЗ</span>
            <ChevronDown size={16} style={{ color: "#4a6080" }} />
          </div>

          {/* Features section */}
          <div style={{ background: "#0b1120", borderTop: "1px solid #1e2d42", padding: "80px clamp(24px, 6vw, 80px)" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ fontSize: 12, color: "#3b82f6", fontWeight: 700, letterSpacing: "0.15em", marginBottom: 12 }}>ВСЁ ЧТО НУЖНО</div>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#d1d9e6", letterSpacing: "-0.02em" }}>Полный опыт главного тренера</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, maxWidth: 1100, margin: "0 auto" }}>
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} style={{
                  background: "#111827", border: "1px solid #1e2d42", borderRadius: 10, padding: 24,
                  transition: "border-color 0.2s",
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <Icon size={20} style={{ color: "#3b82f6" }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#d1d9e6", marginBottom: 8 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "#4a6080", lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>

            {/* Final CTA */}
            <div style={{ textAlign: "center", marginTop: 64 }}>
              <button
                onClick={() => setPhase("select")}
                style={{
                  background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8,
                  padding: "16px 40px", fontSize: 16, fontWeight: 700, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 8,
                  boxShadow: "0 0 32px rgba(59,130,246,0.3)"
                }}>
                Начать карьеру <ChevronRight size={18} />
              </button>
              <div style={{ fontSize: 12, color: "#4a6080", marginTop: 12 }}>Бесплатно · Без регистрации · Мгновенный старт</div>
            </div>
          </div>
        </div>
      )}

      {/* ── CLUB SELECTION ── */}
      {phase === "select" && (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

          {/* Header */}
          <div style={{ background: "#0c1220", borderBottom: "1px solid #1e2d42", padding: "16px 32px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 20 }}>
            <button onClick={() => setPhase("hero")} style={{ background: "transparent", border: "none", color: "#4a6080", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
              ← Назад
            </button>
            <div style={{ width: 1, height: 20, background: "#1e2d42" }} />
            <div style={{ fontWeight: 700, fontSize: 14, color: "#d1d9e6" }}>Выбери клуб</div>
            <div style={{ marginLeft: "auto", fontSize: 12, color: "#4a6080" }}>Премьер-лига 2025/26</div>
          </div>

          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* Club grid */}
            <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
              {/* Search */}
              <div style={{ marginBottom: 20 }}>
                <input
                  type="text"
                  placeholder="Поиск клубов…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    background: "#111827", border: "1px solid #1e2d42", borderRadius: 6,
                    padding: "8px 14px", color: "#d1d9e6", fontSize: 13, width: "100%", maxWidth: 320, outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {filtered.map(club => {
                  const isSelected = selectedClub?.id === club.id;
                  const tier = tierBadge((club as any).prestige ?? 3);
                  return (
                    <div
                      key={club.id}
                      onClick={() => setSelectedClub(isSelected ? null : club)}
                      style={{
                        background: isSelected ? "#0e1e36" : "#111827",
                        border: `1px solid ${isSelected ? "#3b82f6" : "#1e2d42"}`,
                        borderRadius: 10, padding: 18, cursor: "pointer",
                        transition: "all 0.15s",
                        boxShadow: isSelected ? "0 0 0 1px #3b82f6, 0 0 20px rgba(59,130,246,0.12)" : "none",
                        position: "relative", overflow: "hidden",
                      }}>

                      {isSelected && (
                        <div style={{ position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700 }}>✓</div>
                      )}

                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: isSelected ? "#60a5fa" : "#d1d9e6", marginBottom: 2 }}>{club.name}</div>
                          <div style={{ fontSize: 11, color: "#4a6080" }}>{(club as any).stadium ?? "Premier League"}</div>
                        </div>
                        <span style={{
                          background: tier.color + "22", color: tier.color,
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.05em", whiteSpace: "nowrap"
                        }}>{tier.label}</span>
                      </div>

                      <div style={{ fontSize: 12, color: "#4a6080", lineHeight: 1.5, marginBottom: 14, minHeight: 36 }}>
                        {((club as any).description ?? "Premier League club ready for a new manager.").substring(0, 90)}…
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        {[
                          { label: "Бюджет", value: `£${((club.budget ?? 0) / 1_000_000).toFixed(1)}M`, color: "#34d399" },
                          { label: "Престиж", value: <PrestigeStars n={(club as any).prestige ?? 3} />, color: "#f59e0b" },
                          { label: "Состав", value: (club as any).squadSize ?? 25, color: "#60a5fa" },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ background: "#0b1120", borderRadius: 6, padding: "8px 6px", textAlign: "center" }}>
                            <div style={{ color, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{value}</div>
                            <div style={{ fontSize: 10, color: "#4a6080" }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 0", color: "#4a6080" }}>
                    Клубы не найдены: «{search}»
                  </div>
                )}
              </div>
            </div>

            {/* Right panel */}
            <div style={{ width: 320, borderLeft: "1px solid #1e2d42", background: "#0c1220", display: "flex", flexDirection: "column", padding: 24, gap: 20 }}>

              {!selectedClub ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 12 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: "#111827", border: "1px dashed #1e2d42", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>⚽</div>
                  <div style={{ fontWeight: 600, color: "#d1d9e6", fontSize: 15 }}>Выбери клуб</div>
                  <div style={{ fontSize: 13, color: "#4a6080", lineHeight: 1.6 }}>Нажми на любой клуб из списка, чтобы увидеть детали и начать карьеру тренера.</div>
                </div>
              ) : (
                <>
                  {/* Club detail */}
                  <div style={{ background: "#111827", border: "1px solid #1e2d42", borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 10, color: "#4a6080", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 10 }}>ВЫБРАННЫЙ КЛУБ</div>
                    <div style={{ fontWeight: 800, fontSize: 20, color: "#d1d9e6", marginBottom: 4 }}>{selectedClub.name}</div>
                    <div style={{ fontSize: 12, color: "#4a6080", marginBottom: 12, lineHeight: 1.5 }}>
                      {(selectedClub.description ?? "").substring(0, 120)}…
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Трансф. бюджет", value: `£${((selectedClub.budget ?? 0) / 1_000_000).toFixed(1)}M`, color: "#34d399" },
                        { label: "Стадион", value: selectedClub.stadium ?? "—", color: "#d1d9e6" },
                        { label: "Престиж", value: <PrestigeStars n={selectedClub.prestige ?? 3} />, color: "#f59e0b" },
                        { label: "Лига", value: "Премьер-лига", color: "#60a5fa" },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: "#0b1120", borderRadius: 6, padding: 10 }}>
                          <div style={{ fontSize: 10, color: "#4a6080", marginBottom: 4 }}>{label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manager name */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "#4a6080", fontWeight: 600, marginBottom: 8 }}>ИМЯ МЕНЕДЖЕРА</label>
                    <input
                      type="text"
                      placeholder="напр. Алекс Фергюсон"
                      value={managerName}
                      onChange={e => { setManagerName(e.target.value); setError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleStart()}
                      style={{
                        width: "100%", background: "#111827", border: `1px solid ${error ? "#ef4444" : "#1e2d42"}`,
                        borderRadius: 6, padding: "10px 12px", color: "#d1d9e6", fontSize: 14, outline: "none", boxSizing: "border-box"
                      }}
                    />
                  </div>

                  {error && (
                    <div style={{ fontSize: 12, color: "#ef4444", background: "#1c1010", border: "1px solid #3d1515", borderRadius: 6, padding: "8px 12px" }}>
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleStart}
                    disabled={starting || !managerName.trim()}
                    style={{
                      background: starting || !managerName.trim() ? "#1e2d42" : "#3b82f6",
                      color: starting || !managerName.trim() ? "#4a6080" : "#fff",
                      border: "none", borderRadius: 8, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: starting || !managerName.trim() ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
                      transition: "all 0.15s",
                      boxShadow: !starting && managerName.trim() ? "0 0 24px rgba(59,130,246,0.3)" : "none",
                    }}>
                    {starting ? "Запускаем сезон…" : "Начать сезон"}
                    {!starting && <ChevronRight size={18} />}
                  </button>

                  <div style={{ fontSize: 11, color: "#4a6080", textAlign: "center" }}>
                    Тактику и настройки можно изменить после начала игры.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
