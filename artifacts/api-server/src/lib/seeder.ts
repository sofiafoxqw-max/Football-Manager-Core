import { db } from "@workspace/db";
import {
  leaguesTable, clubsTable, playersTable, gameStateTable,
  tacticsTable, inboxTable, fixturesTable, transfersTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateFixtures, getWeekDate } from "./gameEngine";

export { getWeekDate };

const PLAYER_NAMES = {
  GK: ["Oliver Schäfer", "James Thornton", "Luca Ferrini", "Marco Delgado", "Takeshi Yamamoto", "Pierre Moreau", "Rafa Solano", "Anton Volkov", "David O'Brien", "Carlos Ruiz"],
  CB: ["Marcus Steele", "Johann Braun", "Roberto Pellegrini", "Alejandro Torres", "Kenji Nakamura", "Hugo Leclerc", "Sergio Mendez", "Viktor Koval", "Patrick Murphy", "Felipe Costa", "Adama Diallo", "Thomas Eriksson", "Stanislav Horak", "Nikolas Papadopoulos", "Yusuf Al-Hassan"],
  RB: ["Danny Hartmann", "Antonio Savio", "Gabriel Fontes", "Mateo Rios", "Ryota Tanaka", "Theo Dubois", "Luis Vega", "Oleksiy Kravchenko", "Sean Gallagher", "Bruno Almada"],
  LB: ["Chris Vance", "Emilio Russo", "Pedro Almeida", "Diego Fuentes", "Hiroshi Watanabe", "Maxime Girard", "Raul Jimenez", "Bohdan Marchenko", "Declan Foley", "Tomas Silva"],
  CDM: ["Kevin Strauss", "Lorenzo Conti", "Rafael Barbosa", "Andres Castillo", "Sota Inoue", "Romain Blanc", "Eduardo Vargas", "Mykola Sydorenko", "Ronan O'Sullivan", "Claudio Reyes"],
  CM: ["Florian Bauer", "Matteo Rossi", "Diogo Carvalho", "Pablo Herrera", "Yuki Hashimoto", "Antoine Lemaire", "Rodrigo Pena", "Dmytro Bondarenko", "Ciarán Walsh", "Leandro Morais", "Erik Lindqvist", "Jakub Kucera", "Nikos Stavros", "Omar Farouk", "Samuel Osei"],
  CAM: ["Lukas Fischer", "Francesco Bianchi", "Bruno Santos", "Carlos Molina", "Daichi Suzuki", "Clement Fontaine", "Miguel Soto", "Artem Petrenko", "Conor Daly", "Ivan Gomes"],
  RM: ["Felix Wagner", "Nicola Greco", "Fabio Neves", "Juan Moreno", "Haruto Endo", "Pierre-Antoine Faure", "Daniel Ortiz", "Serhiy Shevchuk", "Liam Brennan", "Renato Dias"],
  LM: ["Tobias Koch", "Simone Marini", "Vitor Pereira", "Alejandro Ruiz", "Shota Matsumoto", "Francois Charpentier", "Javier Castro", "Oleh Tkachenko", "Brendan Flynn", "Ricardo Faria"],
  RW: ["Adrian Krause", "Davide Esposito", "Nelson Figueiredo", "Cesar Gutierrez", "Kota Shimizu", "Kevin Roux", "Alvaro Blanco", "Maksym Savchenko", "Aiden McCarthy", "Thiago Ribeiro"],
  LW: ["Sebastian Mueller", "Gianluca Ricci", "Rui Bastos", "Eduardo Ramos", "Yusei Hayashi", "Julien Morel", "Francisco Reyes", "Roman Kovalenko", "Niall Sheridan", "Enzo Pereira"],
  ST: ["Alexander Weber", "Marco Vitale", "Cristiano Ferreira", "Diego Sanchez", "Kaito Fujiwara", "Baptiste Lefevre", "Roberto Flores", "Andriy Shevchuk", "Cormac Doyle", "Lucas Tavares", "Emil Johansson", "Martin Hajek", "Kostas Papadopoulos", "Khalid Mansouri", "Emmanuel Asante"],
  CF: ["Niklas Hoffmann", "Alessio Gallo", "Joao Moutinho", "Fernando Lopez", "Yuta Kobayashi", "Nicolas Perrin", "Pablo Morales", "Danylo Korolenko", "Eoin Sullivan", "Marcelo Costa"],
};

const NATIONALITIES = ["German", "Italian", "Brazilian", "Spanish", "Japanese", "French", "Colombian", "Ukrainian", "Irish", "Portuguese", "English", "Argentine", "Dutch", "Belgian", "Croatian", "Serbian", "Polish", "Czech", "Greek", "Moroccan", "Senegalese", "Nigerian", "Swedish", "Norwegian", "Danish"];

function rng(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePlayerAttrs(position: string, overall: number) {
  const base = Math.max(overall - 15, 30);
  const high = Math.min(overall + 10, 99);
  const isGK = position === "GK";
  const isAtt = ["ST", "CF", "LW", "RW", "CAM"].includes(position);
  const isDef = ["CB", "RB", "LB", "CDM"].includes(position);

  return {
    pace: isGK ? rng(20, 45) : (isAtt ? rng(high - 5, high) : rng(base, high)),
    shooting: isGK ? rng(5, 20) : (isAtt ? rng(high - 5, high) : isDef ? rng(base - 10, base + 10) : rng(base, high - 5)),
    passing: isGK ? rng(40, 65) : rng(base, high),
    dribbling: isGK ? rng(10, 30) : (isAtt ? rng(high - 5, high) : rng(base, high - 5)),
    defending: isGK ? rng(10, 25) : (isDef ? rng(high - 5, high) : isAtt ? rng(base - 10, base + 10) : rng(base, high)),
    physicality: rng(base, high),
    goalkeeping: isGK ? rng(high - 5, high) : rng(5, 25),
  };
}

const CLUBS_DATA = [
  // Premier League
  { name: "Arsenal FC", city: "London", country: "England", reputation: 5, budget: 120000, wageBudget: 2500, stadiumName: "Emirates Stadium", stadiumCapacity: 60704, colors: "#EF0107", playerRangeMin: 72, playerRangeMax: 88 },
  { name: "Chelsea FC", city: "London", country: "England", reputation: 5, budget: 130000, wageBudget: 2800, stadiumName: "Stamford Bridge", stadiumCapacity: 40834, colors: "#034694", playerRangeMin: 72, playerRangeMax: 87 },
  { name: "Liverpool FC", city: "Liverpool", country: "England", reputation: 5, budget: 115000, wageBudget: 2600, stadiumName: "Anfield", stadiumCapacity: 61276, colors: "#C8102E", playerRangeMin: 74, playerRangeMax: 90 },
  { name: "Manchester City", city: "Manchester", country: "England", reputation: 5, budget: 160000, wageBudget: 3200, stadiumName: "Etihad Stadium", stadiumCapacity: 55097, colors: "#6CABDD", playerRangeMin: 76, playerRangeMax: 92 },
  { name: "Manchester United", city: "Manchester", country: "England", reputation: 5, budget: 110000, wageBudget: 2400, stadiumName: "Old Trafford", stadiumCapacity: 74879, colors: "#DA291C", playerRangeMin: 71, playerRangeMax: 87 },
  { name: "Tottenham Hotspur", city: "London", country: "England", reputation: 4, budget: 90000, wageBudget: 2000, stadiumName: "Tottenham Hotspur Stadium", stadiumCapacity: 62850, colors: "#132257", playerRangeMin: 70, playerRangeMax: 85 },
  { name: "Newcastle United", city: "Newcastle", country: "England", reputation: 4, budget: 95000, wageBudget: 1900, stadiumName: "St. James' Park", stadiumCapacity: 52305, colors: "#241F20", playerRangeMin: 69, playerRangeMax: 84 },
  { name: "Aston Villa", city: "Birmingham", country: "England", reputation: 4, budget: 80000, wageBudget: 1700, stadiumName: "Villa Park", stadiumCapacity: 42682, colors: "#670E36", playerRangeMin: 68, playerRangeMax: 83 },
  { name: "Brighton & Hove Albion", city: "Brighton", country: "England", reputation: 3, budget: 60000, wageBudget: 1300, stadiumName: "Amex Stadium", stadiumCapacity: 31800, colors: "#0057B8", playerRangeMin: 66, playerRangeMax: 80 },
  { name: "Brentford FC", city: "London", country: "England", reputation: 3, budget: 45000, wageBudget: 1100, stadiumName: "Gtech Community Stadium", stadiumCapacity: 17250, colors: "#E30613", playerRangeMin: 64, playerRangeMax: 78 },
  { name: "Fulham FC", city: "London", country: "England", reputation: 3, budget: 50000, wageBudget: 1100, stadiumName: "Craven Cottage", stadiumCapacity: 25700, colors: "#000000", playerRangeMin: 64, playerRangeMax: 78 },
  { name: "Everton FC", city: "Liverpool", country: "England", reputation: 3, budget: 40000, wageBudget: 1000, stadiumName: "Goodison Park", stadiumCapacity: 39414, colors: "#003399", playerRangeMin: 63, playerRangeMax: 77 },
  { name: "Wolverhampton Wanderers", city: "Wolverhampton", country: "England", reputation: 3, budget: 45000, wageBudget: 1100, stadiumName: "Molineux", stadiumCapacity: 32050, colors: "#FDB913", playerRangeMin: 64, playerRangeMax: 78 },
  { name: "Crystal Palace", city: "London", country: "England", reputation: 3, budget: 40000, wageBudget: 900, stadiumName: "Selhurst Park", stadiumCapacity: 25486, colors: "#1B458F", playerRangeMin: 63, playerRangeMax: 76 },
  { name: "West Ham United", city: "London", country: "England", reputation: 3, budget: 55000, wageBudget: 1200, stadiumName: "London Stadium", stadiumCapacity: 62500, colors: "#7A263A", playerRangeMin: 65, playerRangeMax: 79 },
  { name: "Nottingham Forest", city: "Nottingham", country: "England", reputation: 3, budget: 42000, wageBudget: 1000, stadiumName: "City Ground", stadiumCapacity: 30445, colors: "#DD0000", playerRangeMin: 63, playerRangeMax: 77 },
  { name: "AFC Bournemouth", city: "Bournemouth", country: "England", reputation: 2, budget: 35000, wageBudget: 850, stadiumName: "Vitality Stadium", stadiumCapacity: 11364, colors: "#DA291C", playerRangeMin: 61, playerRangeMax: 74 },
  { name: "Leicester City", city: "Leicester", country: "England", reputation: 3, budget: 40000, wageBudget: 1000, stadiumName: "King Power Stadium", stadiumCapacity: 32261, colors: "#003090", playerRangeMin: 63, playerRangeMax: 77 },
  { name: "Ipswich Town", city: "Ipswich", country: "England", reputation: 2, budget: 30000, wageBudget: 750, stadiumName: "Portman Road", stadiumCapacity: 29400, colors: "#3A64A3", playerRangeMin: 60, playerRangeMax: 73 },
  { name: "Southampton FC", city: "Southampton", country: "England", reputation: 2, budget: 28000, wageBudget: 700, stadiumName: "St Mary's Stadium", stadiumCapacity: 32384, colors: "#D71920", playerRangeMin: 59, playerRangeMax: 72 },
];

const POSITIONS_BY_FORMATION: Record<string, string[]> = {
  "4-3-3": ["GK", "RB", "CB", "CB", "LB", "CM", "CM", "CM", "RW", "ST", "LW"],
  "4-4-2": ["GK", "RB", "CB", "CB", "LB", "RM", "CM", "CM", "LM", "ST", "ST"],
  "4-2-3-1": ["GK", "RB", "CB", "CB", "LB", "CDM", "CDM", "RM", "CAM", "LM", "ST"],
};

async function namePool(position: string, used: Set<string>): Promise<string> {
  const pool = PLAYER_NAMES[position as keyof typeof PLAYER_NAMES] || PLAYER_NAMES.CM;
  const available = pool.filter(n => !used.has(n));
  if (available.length > 0) {
    const name = available[Math.floor(Math.random() * available.length)];
    used.add(name);
    return name;
  }
  // Generate a unique fallback
  const base = pool[Math.floor(Math.random() * pool.length)];
  const name = `${base} Jr.`;
  used.add(name);
  return name;
}

export async function seedGame() {
  // Check if already seeded
  const existing = await db.select().from(leaguesTable).limit(1);
  if (existing.length > 0) return;

  const usedNames = new Set<string>();

  // Create Premier League
  const [league] = await db.insert(leaguesTable).values({
    name: "Premier League",
    country: "England",
    season: 2026,
    totalWeeks: 38,
  }).returning();

  // Create clubs
  const clubIds: number[] = [];
  for (const clubData of CLUBS_DATA) {
    const [club] = await db.insert(clubsTable).values({
      ...clubData,
      leagueId: league.id,
      budget: clubData.budget,
      wageBudget: clubData.wageBudget,
      sponsorshipRevenue: Math.floor(clubData.wageBudget * 52 * 0.3),
    }).returning();
    clubIds.push(club.id);

    // Create squad (23-25 players per club)
    const squadSize = rng(23, 25);
    const positionSlots = [
      { pos: "GK", count: 2 },
      { pos: "CB", count: 4 },
      { pos: "RB", count: 2 },
      { pos: "LB", count: 2 },
      { pos: "CDM", count: 2 },
      { pos: "CM", count: 3 },
      { pos: "CAM", count: 1 },
      { pos: "RM", count: 1 },
      { pos: "LM", count: 1 },
      { pos: "RW", count: 1 },
      { pos: "LW", count: 1 },
      { pos: "ST", count: 3 },
      { pos: "CF", count: 1 },
    ];

    for (const slot of positionSlots) {
      for (let i = 0; i < slot.count; i++) {
        const overall = rng(clubData.playerRangeMin, clubData.playerRangeMax);
        const potential = rng(overall, Math.min(99, overall + rng(2, 12)));
        const attrs = generatePlayerAttrs(slot.pos, overall);
        const age = rng(18, 34);
        const value = Math.floor(overall * overall * 1.2 + rng(0, 5000));
        const salary = Math.floor(value / 250 + rng(5, 30));

        await db.insert(playersTable).values({
          name: await namePool(slot.pos, usedNames),
          age,
          nationality: NATIONALITIES[rng(0, NATIONALITIES.length - 1)],
          position: slot.pos,
          overall,
          potential,
          ...attrs,
          form: rng(4, 8),
          fitness: rng(75, 100),
          morale: ["excellent", "good", "good", "okay"][rng(0, 3)],
          value,
          weeklySalary: salary,
          contractEndsYear: rng(2026, 2029),
          clubId: club.id,
          isOnTransferList: Math.random() < 0.15,
        });
      }
    }
  }

  // Create fixtures (round-robin)
  await generateFixtures(league.id, clubIds, 2026);

  // Initialize game state
  await db.insert(gameStateTable).values({
    started: false,
    currentWeek: 0,
    season: 2026,
  });
}

export async function initPlayerClub(clubId: number, season: number) {
  // Set up default tactics
  const players = await db
    .select({ id: playersTable.id, position: playersTable.position, overall: playersTable.overall })
    .from(playersTable)
    .where(eq(playersTable.clubId, clubId));

  const byPosition: Record<string, typeof players> = {};
  for (const p of players) {
    if (!byPosition[p.position]) byPosition[p.position] = [];
    byPosition[p.position].push(p);
  }

  function bestAt(...positions: string[]) {
    for (const pos of positions) {
      const pool = byPosition[pos];
      if (pool && pool.length > 0) {
        pool.sort((a, b) => b.overall - a.overall);
        return pool.shift() ?? null;
      }
    }
    return null;
  }

  const xi = [
    { slot: 0, position: "GK", player: bestAt("GK") },
    { slot: 1, position: "RB", player: bestAt("RB") },
    { slot: 2, position: "CB", player: bestAt("CB") },
    { slot: 3, position: "CB", player: bestAt("CB") },
    { slot: 4, position: "LB", player: bestAt("LB") },
    { slot: 5, position: "CM", player: bestAt("CM", "CDM") },
    { slot: 6, position: "CM", player: bestAt("CM", "CAM") },
    { slot: 7, position: "CM", player: bestAt("CM", "CDM") },
    { slot: 8, position: "RW", player: bestAt("RW", "RM") },
    { slot: 9, position: "ST", player: bestAt("ST", "CF") },
    { slot: 10, position: "LW", player: bestAt("LW", "LM") },
  ];

  const startingXI = xi.map(s => ({
    slot: s.slot,
    position: s.position,
    playerId: s.player?.id ?? null,
    playerName: s.player ? players.find(p => p.id === s.player!.id)?.position : null,
  }));

  await db.insert(tacticsTable).values({
    clubId,
    formation: "4-3-3",
    mentality: "balanced",
    pressing: 6,
    tempo: 6,
    width: 6,
    startingXI,
  }).onConflictDoNothing();

  // Welcome inbox message
  await db.insert(inboxTable).values({
    clubId,
    date: getWeekDate(season, 1),
    subject: "Welcome to the club, Boss",
    body: `Congratulations on your appointment as the new manager. The board has high expectations for the season ahead. We'll be judging success based on league position and style of play. Good luck — you'll need it.\n\nYours,\nThe Board of Directors`,
    type: "board",
    isRead: false,
  });

  await db.insert(inboxTable).values({
    clubId,
    date: getWeekDate(season, 1),
    subject: "Season objectives",
    body: `Your primary objective for this season is to finish in the top half of the table. Secondary objectives include developing young players and maintaining financial stability.\n\nWe look forward to watching the team progress under your guidance.`,
    type: "board",
    isRead: false,
  });
}
