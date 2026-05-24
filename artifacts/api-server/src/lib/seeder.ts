import { db } from "@workspace/db";
import {
  leaguesTable, clubsTable, playersTable, gameStateTable,
  tacticsTable, inboxTable, fixturesTable, transfersTable, staffTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateFixtures, getWeekDate } from "./gameEngine";

export { getWeekDate };

const PLAYER_NAMES = {
  GK: ["Oliver Schäfer", "James Thornton", "Luca Ferrini", "Marco Delgado", "Takeshi Yamamoto", "Pierre Moreau", "Rafa Solano", "Anton Volkov", "David O'Brien", "Carlos Ruiz", "Emeka Obi", "Lars Svensson"],
  CB: ["Marcus Steele", "Johann Braun", "Roberto Pellegrini", "Alejandro Torres", "Kenji Nakamura", "Hugo Leclerc", "Sergio Mendez", "Viktor Koval", "Patrick Murphy", "Felipe Costa", "Adama Diallo", "Thomas Eriksson", "Stanislav Horak", "Nikolas Papadopoulos", "Yusuf Al-Hassan", "Ibrahim Touré", "Lasse Møller"],
  RB: ["Danny Hartmann", "Antonio Savio", "Gabriel Fontes", "Mateo Rios", "Ryota Tanaka", "Theo Dubois", "Luis Vega", "Oleksiy Kravchenko", "Sean Gallagher", "Bruno Almada", "Kwame Asante", "Mikael Lindberg"],
  LB: ["Chris Vance", "Emilio Russo", "Pedro Almeida", "Diego Fuentes", "Hiroshi Watanabe", "Maxime Girard", "Raul Jimenez", "Bohdan Marchenko", "Declan Foley", "Tomas Silva", "Oumar Cissé", "Erik Haugen"],
  CDM: ["Kevin Strauss", "Lorenzo Conti", "Rafael Barbosa", "Andres Castillo", "Sota Inoue", "Romain Blanc", "Eduardo Vargas", "Mykola Sydorenko", "Ronan O'Sullivan", "Claudio Reyes", "Moussa Kouyaté", "Anders Holm"],
  CM: ["Florian Bauer", "Matteo Rossi", "Diogo Carvalho", "Pablo Herrera", "Yuki Hashimoto", "Antoine Lemaire", "Rodrigo Pena", "Dmytro Bondarenko", "Ciarán Walsh", "Leandro Morais", "Erik Lindqvist", "Jakub Kucera", "Nikos Stavros", "Omar Farouk", "Samuel Osei", "Christophe Moreau", "Arjan de Boer"],
  CAM: ["Lukas Fischer", "Francesco Bianchi", "Bruno Santos", "Carlos Molina", "Daichi Suzuki", "Clement Fontaine", "Miguel Soto", "Artem Petrenko", "Conor Daly", "Ivan Gomes", "Abou Diakité", "Håkon Berg"],
  RM: ["Felix Wagner", "Nicola Greco", "Fabio Neves", "Juan Moreno", "Haruto Endo", "Pierre-Antoine Faure", "Daniel Ortiz", "Serhiy Shevchuk", "Liam Brennan", "Renato Dias", "Seun Adeleke"],
  LM: ["Tobias Koch", "Simone Marini", "Vitor Pereira", "Alejandro Ruiz", "Shota Matsumoto", "Francois Charpentier", "Javier Castro", "Oleh Tkachenko", "Brendan Flynn", "Ricardo Faria", "Mamadou Coulibaly"],
  RW: ["Adrian Krause", "Davide Esposito", "Nelson Figueiredo", "Cesar Gutierrez", "Kota Shimizu", "Kevin Roux", "Alvaro Blanco", "Maksym Savchenko", "Aiden McCarthy", "Thiago Ribeiro", "Kofi Mensah", "Robin Gustafsson"],
  LW: ["Sebastian Mueller", "Gianluca Ricci", "Rui Bastos", "Eduardo Ramos", "Yusei Hayashi", "Julien Morel", "Francisco Reyes", "Roman Kovalenko", "Niall Sheridan", "Enzo Pereira", "Ibrahima Diallo", "Pontus Larsson"],
  ST: ["Alexander Weber", "Marco Vitale", "Cristiano Ferreira", "Diego Sanchez", "Kaito Fujiwara", "Baptiste Lefevre", "Roberto Flores", "Andriy Shevchuk", "Cormac Doyle", "Lucas Tavares", "Emil Johansson", "Martin Hajek", "Kostas Papadopoulos", "Khalid Mansouri", "Emmanuel Asante", "Cheikh Diouf"],
  CF: ["Niklas Hoffmann", "Alessio Gallo", "Joao Moutinho", "Fernando Lopez", "Yuta Kobayashi", "Nicolas Perrin", "Pablo Morales", "Danylo Korolenko", "Eoin Sullivan", "Marcelo Costa", "Ibou Touré"],
};

const NATIONALITIES = ["German", "Italian", "Brazilian", "Spanish", "Japanese", "French", "Colombian", "Ukrainian", "Irish", "Portuguese", "English", "Argentine", "Dutch", "Belgian", "Croatian", "Serbian", "Polish", "Czech", "Greek", "Moroccan", "Senegalese", "Nigerian", "Swedish", "Norwegian", "Danish", "Ghanaian", "Ivorian", "Turkish", "Russian", "Austrian"];

const PREFERRED_FEET = ["right", "right", "right", "right", "left", "both"];

const POSITION_ROLES: Record<string, string[]> = {
  GK: ["Goalkeeper", "Sweeper Keeper"],
  CB: ["Ball-Playing Defender", "No-Nonsense Centreback", "Libero"],
  RB: ["Full Back", "Wing Back", "Inverted Full Back"],
  LB: ["Full Back", "Wing Back", "Inverted Full Back"],
  CDM: ["Defensive Midfielder", "Deep-Lying Playmaker", "Ball-Winning Midfielder"],
  CM: ["Box-to-Box Midfielder", "Carrilero", "Central Midfielder"],
  CAM: ["Advanced Playmaker", "Enganche", "Shadow Striker"],
  RM: ["Wide Midfielder", "Winger", "Wide Playmaker"],
  LM: ["Wide Midfielder", "Winger", "Wide Playmaker"],
  RW: ["Inside Forward", "Winger", "Inverted Winger"],
  LW: ["Inside Forward", "Winger", "Inverted Winger"],
  ST: ["Advanced Forward", "Target Man", "Pressing Forward", "False 9"],
  CF: ["Complete Forward", "Poacher", "Deep-Lying Forward"],
};

const PLAYER_DESCRIPTIONS: Record<string, string[]> = {
  GK: ["A commanding keeper with excellent shot-stopping ability.", "A sweeper keeper who excels with the ball at his feet.", "A reliable shot-stopper with good positioning.", "An experienced keeper who controls his area well."],
  CB: ["A dominant centre-back who reads the game exceptionally well.", "A ball-playing defender comfortable carrying the ball forward.", "A physical defender strong in aerial duels.", "A composed centreback who rarely loses his man."],
  RB: ["An energetic full-back who loves to get forward.", "A defensively solid right-back with good recovery pace.", "A versatile full-back capable of playing several positions.", "A wing-back who provides width and quality crosses."],
  LB: ["A cultured left-back with an excellent left foot.", "An attacking full-back who combines defensive solidity with creativity.", "A dependable full-back strong in one-on-one situations.", "A technical left-back comfortable in tight spaces."],
  CDM: ["A tireless defensive midfielder who shields the back four.", "A deep-lying playmaker who distributes the ball well.", "A ball-winner who breaks up opposition attacks.", "A disciplined holding midfielder with good positioning."],
  CM: ["A dynamic box-to-box midfielder with a huge engine.", "A creative central midfielder with an eye for the killer pass.", "A balanced midfielder who contributes in all areas.", "A technically gifted midfielder who controls the tempo."],
  CAM: ["A gifted playmaker who creates chances with ease.", "An advanced midfielder with an eye for goal.", "A creative number 10 who dictates play.", "A technical player who thrives in tight spaces."],
  RM: ["A pacey wide midfielder who delivers quality crosses.", "A hard-working right-sided midfielder with a good work rate.", "A tricky winger who can beat defenders one-on-one.", "A versatile wide player comfortable on either flank."],
  LM: ["A direct left-sided midfielder with electric pace.", "A composed wide player with excellent decision-making.", "A creative left midfielder with a great left foot.", "A tenacious wide midfielder who presses relentlessly."],
  RW: ["A devastating right winger with blistering pace.", "An inside forward who cuts inside to shoot.", "A skilful winger who terrorises full-backs.", "An explosive attacker with great dribbling ability."],
  LW: ["A tricky left winger who loves to take on defenders.", "A creative wide forward with excellent vision.", "A pacy left winger with great crossing ability.", "A goal-scoring winger who contributes at both ends."],
  ST: ["A clinical striker with an excellent goal-scoring record.", "A powerful target man who brings others into play.", "A pressing forward who leads the line with intensity.", "A natural goalscorer with great movement in the box."],
  CF: ["A complete forward capable of playing in multiple roles.", "A technical striker with great link-up play.", "A mobile centre-forward with great awareness.", "A versatile attacker who can play across the front line."],
};

const STAFF_DATA = [
  // Assistant Managers
  { name: "Robert van der Berg", role: "assistant_manager", nationality: "Dutch", rating: 8, speciality: "Tactical Analysis", weeklySalary: 3500 },
  { name: "Graham Hughes", role: "assistant_manager", nationality: "English", rating: 7, speciality: "Man Management", weeklySalary: 2800 },
  { name: "Paulo Ferreira", role: "assistant_manager", nationality: "Portuguese", rating: 9, speciality: "Attacking Play", weeklySalary: 4200 },
  { name: "Klaus Werner", role: "assistant_manager", nationality: "German", rating: 6, speciality: "Defensive Organisation", weeklySalary: 2200 },
  // Coaches
  { name: "Steve Harrington", role: "coach", nationality: "English", rating: 7, speciality: "Attacking Play", weeklySalary: 1800 },
  { name: "Marcos Delgado", role: "coach", nationality: "Spanish", rating: 8, speciality: "Technical Skills", weeklySalary: 2200 },
  { name: "Jean-Pierre Moreau", role: "coach", nationality: "French", rating: 7, speciality: "Set Pieces", weeklySalary: 1900 },
  { name: "Lars Andersen", role: "coach", nationality: "Danish", rating: 6, speciality: "Youth Development", weeklySalary: 1500 },
  // Fitness Coaches
  { name: "Dr. Emma Walsh", role: "fitness_coach", nationality: "Irish", rating: 8, speciality: "Sports Science", weeklySalary: 2000 },
  { name: "Marco Vitelli", role: "fitness_coach", nationality: "Italian", rating: 9, speciality: "Athletic Performance", weeklySalary: 2500 },
  { name: "Henrik Sørensen", role: "fitness_coach", nationality: "Norwegian", rating: 7, speciality: "Injury Prevention", weeklySalary: 1800 },
  // Goalkeeper Coaches
  { name: "Josef Novak", role: "goalkeeper_coach", nationality: "Czech", rating: 8, speciality: "Shot Stopping", weeklySalary: 1700 },
  { name: "Dmitri Petrov", role: "goalkeeper_coach", nationality: "Russian", rating: 7, speciality: "Distribution", weeklySalary: 1400 },
  // Scouts
  { name: "Ahmed Hassan", role: "scout", nationality: "Egyptian", rating: 9, speciality: "African Football", weeklySalary: 1200 },
  { name: "Carlos Ruiz", role: "scout", nationality: "Colombian", rating: 8, speciality: "South American Football", weeklySalary: 1100 },
  { name: "Takashi Mori", role: "scout", nationality: "Japanese", rating: 7, speciality: "Asian Football", weeklySalary: 900 },
  { name: "Frank Müller", role: "scout", nationality: "German", rating: 8, speciality: "European Football", weeklySalary: 1100 },
  // Physios
  { name: "Dr. Sarah Collins", role: "physio", nationality: "English", rating: 8, speciality: "Musculoskeletal", weeklySalary: 1500 },
  { name: "Dr. João Carvalho", role: "physio", nationality: "Portuguese", rating: 9, speciality: "Sports Medicine", weeklySalary: 2000 },
  // Analysts
  { name: "Daniel Kim", role: "analyst", nationality: "South Korean", rating: 8, speciality: "Match Analysis", weeklySalary: 1300 },
  { name: "Emma Thompson", role: "analyst", nationality: "English", rating: 7, speciality: "Opposition Analysis", weeklySalary: 1100 },
];

const CLUB_DESCRIPTIONS: Record<string, string> = {
  "Arsenal FC": "The Gunners are a historic North London club known for their attacking football and passionate support.",
  "Chelsea FC": "A wealthy West London club with a recent history of domestic and European success.",
  "Liverpool FC": "One of England's most successful clubs with a passionate Kop and a rich European pedigree.",
  "Manchester City": "The current Premier League powerhouses backed by significant investment and elite coaching.",
  "Manchester United": "The most successful club in English football history, looking to reclaim past glories.",
  "Tottenham Hotspur": "A North London club with a modern stadium and ambitions to challenge for major honours.",
  "Newcastle United": "The Magpies with their passionate fanbase and new-found wealth are aiming high.",
  "Aston Villa": "A traditional Midlands club with rich history and ambitions to return to European football.",
  "Brighton & Hove Albion": "An innovative club known for their data-driven approach and attractive football.",
  "Brentford FC": "A community-focused West London club that punches above their weight.",
  "Fulham FC": "A well-established Premier League club with a beautiful stadium on the banks of the Thames.",
  "Everton FC": "A Merseyside club with passionate support looking to recapture their historic success.",
  "Wolverhampton Wanderers": "A physically strong Midlands club with a history of producing talented players.",
  "Crystal Palace": "A South London club with passionate support and a reputation for resilience.",
  "West Ham United": "An East London club with a rich history and a modern stadium in the Olympic Park.",
  "Nottingham Forest": "A historic club with two European Cups that is rebuilding its Premier League status.",
  "AFC Bournemouth": "A small South Coast club that has punched above their weight in the Premier League.",
  "Leicester City": "The miracle champions of 2016 looking to stabilise and push for European competition.",
  "Ipswich Town": "A returning Premier League club with ambitions to grow and establish themselves.",
  "Southampton FC": "A club with a proud academy tradition working hard to survive in the top flight.",
};

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
  const base = pool[Math.floor(Math.random() * pool.length)];
  const suffix = ["Jr.", "II", "III", "IV"][Math.floor(Math.random() * 4)];
  const name = `${base} ${suffix}`;
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
    const description = CLUB_DESCRIPTIONS[clubData.name] ?? "A competitive Premier League club with passionate supporters.";
    const [club] = await db.insert(clubsTable).values({
      name: clubData.name,
      city: clubData.city,
      country: clubData.country,
      leagueId: league.id,
      reputation: clubData.reputation,
      budget: clubData.budget,
      wageBudget: clubData.wageBudget,
      stadiumName: clubData.stadiumName,
      stadiumCapacity: clubData.stadiumCapacity,
      colors: clubData.colors,
      description,
      sponsorshipRevenue: Math.floor(clubData.wageBudget * 52 * 0.3),
    }).returning();
    clubIds.push(club.id);

    // Create squad (23-25 players per club)
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
      { pos: "RW", count: 2 },
      { pos: "LW", count: 2 },
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

        const roles = POSITION_ROLES[slot.pos] ?? ["Player"];
        const role = roles[Math.floor(Math.random() * roles.length)];
        const descriptions = PLAYER_DESCRIPTIONS[slot.pos] ?? ["A quality player who contributes to the team."];
        const playerDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
        const preferredFoot = PREFERRED_FEET[Math.floor(Math.random() * PREFERRED_FEET.length)];

        await db.insert(playersTable).values({
          name: await namePool(slot.pos, usedNames),
          age,
          nationality: NATIONALITIES[rng(0, NATIONALITIES.length - 1)],
          position: slot.pos,
          preferredFoot,
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
          isOnTransferList: Math.random() < 0.12,
          isInjured: false,
          injuryWeeksLeft: 0,
          role,
          playerDescription,
          trainingProgress: 0,
        });
      }
    }
  }

  // Create fixtures (round-robin)
  await generateFixtures(league.id, clubIds, 2026);

  // Seed staff (all unattached, available in market)
  for (const staffData of STAFF_DATA) {
    await db.insert(staffTable).values({
      ...staffData,
      isHired: false,
      clubId: null,
    });
  }

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

  const allById = Object.fromEntries(players.map(p => [p.id, p]));

  const startingXI = xi.map(s => ({
    slot: s.slot,
    position: s.position,
    playerId: s.player?.id ?? null,
    playerName: s.player ? (allById[s.player.id]?.position ?? s.position) : null,
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

  // Welcome inbox messages
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

  await db.insert(inboxTable).values({
    clubId,
    date: getWeekDate(season, 1),
    subject: "Transfer window is open",
    body: `The summer transfer window is now open. You have a transfer budget at your disposal to strengthen the squad. Use the transfer market to find the right players for your system.\n\nRemember that wage budget constraints apply — don't overstretch the club's finances.`,
    type: "transfer",
    isRead: false,
  });
}
