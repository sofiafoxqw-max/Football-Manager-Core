import { db } from "@workspace/db";
import {
  gfcLeaguesTable,
  gfcClubsTable,
  gfcPlayersTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

const POSITIONS = ["GK", "CB", "CB", "LB", "RB", "CDM", "CM", "CM", "LW", "RW", "ST"];

const FIRST_NAMES = [
  "Luca", "Marco", "Carlos", "James", "Oliver", "Pierre", "Takeshi", "Ivan",
  "David", "Felipe", "Kwame", "Lars", "Andres", "Sebastian", "Florian",
  "Rafael", "Bruno", "Diego", "Antoine", "Kenji", "Romain", "Eduardo",
  "Viktor", "Conor", "Gabriel", "Moussa", "Erik", "Jakub", "Nikos", "Omar",
];

const LAST_NAMES = [
  "Silva", "Rossi", "Garcia", "Müller", "Johnson", "Dupont", "Yamamoto",
  "Petrov", "Santos", "Ferreira", "Asante", "Svensson", "Torres", "Weber",
  "Bauer", "Barbosa", "Carvalho", "Molina", "Lemaire", "Tanaka", "Blanc",
  "Vargas", "Koval", "Murphy", "Fontes", "Kouyaté", "Lindqvist", "Kucera",
  "Stavros", "Farouk",
];

const NATIONALITIES = [
  "Brazilian", "Italian", "Spanish", "German", "English", "French",
  "Japanese", "Russian", "Portuguese", "Argentinian", "Ghanaian",
  "Swedish", "Colombian", "Austrian", "Belgian", "Ukrainian", "Irish",
  "Czech", "Greek", "Moroccan",
];

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomName() {
  return `${FIRST_NAMES[rnd(0, FIRST_NAMES.length - 1)]} ${LAST_NAMES[rnd(0, LAST_NAMES.length - 1)]}`;
}

function randomNationality() {
  return NATIONALITIES[rnd(0, NATIONALITIES.length - 1)];
}

function positionBaseStats(pos: string) {
  switch (pos) {
    case "GK": return { pace: rnd(45,65), shooting: rnd(20,40), passing: rnd(50,70), dribbling: rnd(40,60), defending: rnd(70,88), physicality: rnd(70,85) };
    case "CB": return { pace: rnd(55,72), shooting: rnd(35,55), passing: rnd(55,72), dribbling: rnd(45,65), defending: rnd(73,90), physicality: rnd(72,88) };
    case "LB": case "RB": return { pace: rnd(68,85), shooting: rnd(40,60), passing: rnd(62,78), dribbling: rnd(60,78), defending: rnd(65,82), physicality: rnd(65,80) };
    case "CDM": return { pace: rnd(55,72), shooting: rnd(45,65), passing: rnd(68,82), dribbling: rnd(60,75), defending: rnd(68,85), physicality: rnd(70,85) };
    case "CM": return { pace: rnd(60,76), shooting: rnd(55,72), passing: rnd(72,86), dribbling: rnd(68,82), defending: rnd(55,72), physicality: rnd(62,78) };
    case "LW": case "RW": return { pace: rnd(75,92), shooting: rnd(68,84), passing: rnd(65,80), dribbling: rnd(75,90), defending: rnd(35,55), physicality: rnd(55,72) };
    case "ST": return { pace: rnd(68,85), shooting: rnd(75,92), passing: rnd(60,75), dribbling: rnd(68,84), defending: rnd(30,50), physicality: rnd(68,85) };
    default: return { pace: 65, shooting: 65, passing: 65, dribbling: 65, defending: 65, physicality: 65 };
  }
}

const LEAGUES = [
  { name: "Premier Division", country: "England", tier: 1, entryFee: 8000000, prizePool: 20000000 },
  { name: "La Primera", country: "Spain", tier: 1, entryFee: 7000000, prizePool: 18000000 },
  { name: "Serie Uno", country: "Italy", tier: 1, entryFee: 6000000, prizePool: 15000000 },
  { name: "Bundesliga Elite", country: "Germany", tier: 1, entryFee: 6500000, prizePool: 16000000 },
  { name: "Ligue Prestige", country: "France", tier: 1, entryFee: 5000000, prizePool: 12000000 },
  { name: "Eredivisie Plus", country: "Netherlands", tier: 2, entryFee: 3000000, prizePool: 8000000 },
  { name: "Superliga Sul", country: "Brazil", tier: 2, entryFee: 2500000, prizePool: 7000000 },
  { name: "J-Global League", country: "Japan", tier: 2, entryFee: 2000000, prizePool: 6000000 },
];

const CLUBS_BY_LEAGUE: Record<string, Array<{ name: string; city: string; stadium: string; colors: string; prestige: number; price: number }>> = {
  "Premier Division": [
    { name: "London City FC", city: "London", stadium: "The Capital Arena", colors: "#003087,#C8102E", prestige: 92, price: 45000000 },
    { name: "Manchester United FC", city: "Manchester", stadium: "Old Empire Stadium", colors: "#DA291C,#000000", prestige: 88, price: 40000000 },
    { name: "Northern Wolves", city: "Leeds", stadium: "Elland Fortress", colors: "#FFFFFF,#FFCD00", prestige: 75, price: 22000000 },
    { name: "Riverside Athletic", city: "Liverpool", stadium: "The Docklands", colors: "#C8102E,#00B2A9", prestige: 80, price: 28000000 },
    { name: "Midland Storm", city: "Birmingham", stadium: "Heartlands Arena", colors: "#663399,#FFD700", prestige: 68, price: 15000000 },
    { name: "Bristol Bay FC", city: "Bristol", stadium: "Harbourside Ground", colors: "#003366,#FF6600", prestige: 62, price: 12000000 },
  ],
  "La Primera": [
    { name: "Atletico Capital", city: "Madrid", stadium: "Estadio Nuevo", colors: "#CC0000,#003366", prestige: 94, price: 50000000 },
    { name: "FC Catalunya", city: "Barcelona", stadium: "Camp Gran", colors: "#A50044,#004D98", prestige: 90, price: 42000000 },
    { name: "Valencia Sol", city: "Valencia", stadium: "Mestalla Plus", colors: "#FF8C00,#000000", prestige: 76, price: 23000000 },
    { name: "Sevilla Sur", city: "Sevilla", stadium: "Ramón Plus", colors: "#CC0000,#FFFFFF", prestige: 78, price: 25000000 },
    { name: "Bilbao Athletic", city: "Bilbao", stadium: "San Mamés 2", colors: "#CC0000,#FFFFFF", prestige: 70, price: 18000000 },
    { name: "Málaga FC", city: "Málaga", stadium: "La Rosaleda", colors: "#00AEEF,#FFFFFF", prestige: 62, price: 11000000 },
  ],
  "Serie Uno": [
    { name: "Milano FC", city: "Milan", stadium: "San Siro Nuovo", colors: "#000000,#CC0000", prestige: 90, price: 40000000 },
    { name: "Juventus Nord", city: "Turin", stadium: "Allianz Plus", colors: "#000000,#FFFFFF", prestige: 87, price: 38000000 },
    { name: "Roma FC", city: "Rome", stadium: "Olimpico Plus", colors: "#CC0000,#FFD700", prestige: 82, price: 30000000 },
    { name: "Napoli FC", city: "Naples", stadium: "Diego Armando 2", colors: "#0080FF,#FFFFFF", prestige: 83, price: 32000000 },
    { name: "Lazio FC", city: "Rome", stadium: "Olimpico Sud", colors: "#87CEEB,#FFFFFF", prestige: 72, price: 20000000 },
    { name: "Fiorentina", city: "Florence", stadium: "Franchi Plus", colors: "#6A0DAD,#FFFFFF", prestige: 68, price: 14000000 },
  ],
  "Bundesliga Elite": [
    { name: "Bayern München FC", city: "Munich", stadium: "Allianz Star", colors: "#DC052D,#FFFFFF", prestige: 95, price: 55000000 },
    { name: "Dortmund BVB", city: "Dortmund", stadium: "Signal Arena", colors: "#FFD700,#000000", prestige: 85, price: 36000000 },
    { name: "Leipzig RB", city: "Leipzig", stadium: "Red Bull Arena", colors: "#CC0000,#FFFFFF", prestige: 78, price: 26000000 },
    { name: "Frankfurt SC", city: "Frankfurt", stadium: "Deutsche Bank Plus", colors: "#CC0000,#000000", prestige: 72, price: 19000000 },
    { name: "Leverkusen", city: "Leverkusen", stadium: "BayArena Plus", colors: "#CC0000,#000000", prestige: 74, price: 20000000 },
    { name: "Gladbach FC", city: "Mönchengladbach", stadium: "Borussia Park", colors: "#FFFFFF,#000000", prestige: 66, price: 13000000 },
  ],
  "Ligue Prestige": [
    { name: "Paris SG", city: "Paris", stadium: "Parc des Stars", colors: "#004170,#CC0000", prestige: 90, price: 42000000 },
    { name: "Olympique Lyon", city: "Lyon", stadium: "Groupama Plus", colors: "#000080,#CC0000", prestige: 80, price: 28000000 },
    { name: "Marseille OM", city: "Marseille", stadium: "Vélodrome Plus", colors: "#00AEEF,#FFFFFF", prestige: 77, price: 22000000 },
    { name: "Monaco AS", city: "Monaco", stadium: "Stade Louis 2", colors: "#CC0000,#FFFFFF", prestige: 75, price: 20000000 },
    { name: "Bordeaux FC", city: "Bordeaux", stadium: "Matmut Plus", colors: "#003366,#FFFFFF", prestige: 66, price: 13000000 },
    { name: "Rennes SC", city: "Rennes", stadium: "Roazhon Arena", colors: "#CC0000,#000000", prestige: 62, price: 11000000 },
  ],
  "Eredivisie Plus": [
    { name: "Ajax Amsterdam", city: "Amsterdam", stadium: "Johan Cruyff Arena", colors: "#CC0000,#FFFFFF", prestige: 82, price: 30000000 },
    { name: "PSV Eindhoven", city: "Eindhoven", stadium: "Philips Stadion", colors: "#CC0000,#FFFFFF", prestige: 78, price: 25000000 },
    { name: "Feyenoord Rotterdam", city: "Rotterdam", stadium: "De Kuip Plus", colors: "#CC0000,#FFFFFF", prestige: 74, price: 20000000 },
    { name: "AZ Alkmaar", city: "Alkmaar", stadium: "AFAS Stadion", colors: "#CC0000,#FFFFFF", prestige: 66, price: 13000000 },
  ],
  "Superliga Sul": [
    { name: "Flamengo RJ", city: "Rio de Janeiro", stadium: "Maracanã Star", colors: "#CC0000,#000000", prestige: 88, price: 35000000 },
    { name: "Santos FC", city: "Santos", stadium: "Vila Belmiro Plus", colors: "#FFFFFF,#000000", prestige: 78, price: 22000000 },
    { name: "Corinthians SP", city: "São Paulo", stadium: "Neo Química Arena", colors: "#000000,#FFFFFF", prestige: 80, price: 25000000 },
    { name: "Grêmio Porto Alegre", city: "Porto Alegre", stadium: "Arena do Grêmio", colors: "#003366,#8CB4CC", prestige: 72, price: 16000000 },
  ],
  "J-Global League": [
    { name: "Tokyo FC", city: "Tokyo", stadium: "National Olympic Stadium", colors: "#003366,#CC0000", prestige: 78, price: 20000000 },
    { name: "Gamba Osaka", city: "Osaka", stadium: "Panasonic Stadium", colors: "#003399,#000000", prestige: 72, price: 15000000 },
    { name: "Urawa Reds", city: "Saitama", stadium: "Saitama Stadium 2", colors: "#CC0000,#FFFFFF", prestige: 74, price: 17000000 },
    { name: "Yokohama Marinos", city: "Yokohama", stadium: "Nissan Stadium Plus", colors: "#003366,#FFFFFF", prestige: 70, price: 14000000 },
  ],
};

function generatePlayers(clubId: number, prestige: number, count = 18) {
  const players = [];
  const positionList = ["GK", "CB", "CB", "LB", "RB", "CDM", "CM", "CM", "LW", "RW", "ST", "ST", "CB", "CM", "LW", "ST", "GK", "RB"].slice(0, count);

  for (const pos of positionList) {
    const baseOverall = Math.min(90, Math.max(55, Math.floor(prestige * 0.75 + rnd(-8, 8))));
    const potential = Math.min(99, baseOverall + rnd(0, 15));
    const stats = positionBaseStats(pos);
    const value = baseOverall * 200000 + rnd(0, 500000);
    const salary = Math.floor(value / 250);
    players.push({
      name: randomName(),
      age: rnd(18, 35),
      nationality: randomNationality(),
      position: pos,
      overall: baseOverall,
      potential,
      ...stats,
      value,
      weeklySalary: salary,
      contractEndsWeek: rnd(20, 120),
      clubId,
      isOnTransferList: false,
      isFreeAgent: false,
    });
  }
  return players;
}

function generateFreeAgents(count = 40) {
  const agents = [];
  for (let i = 0; i < count; i++) {
    const pos = POSITIONS[rnd(0, POSITIONS.length - 1)];
    const overall = rnd(55, 78);
    const stats = positionBaseStats(pos);
    const value = overall * 150000 + rnd(0, 300000);
    agents.push({
      name: randomName(),
      age: rnd(19, 34),
      nationality: randomNationality(),
      position: pos,
      overall,
      potential: Math.min(99, overall + rnd(0, 10)),
      ...stats,
      value,
      weeklySalary: Math.floor(value / 300),
      contractEndsWeek: null,
      clubId: null,
      isOnTransferList: false,
      isFreeAgent: true,
    });
  }
  return agents;
}

export async function seedGfc() {
  const existing = await db.select().from(gfcLeaguesTable).limit(1);
  if (existing.length > 0) return;

  for (const leagueData of LEAGUES) {
    const [league] = await db.insert(gfcLeaguesTable).values(leagueData).returning();
    const clubList = CLUBS_BY_LEAGUE[leagueData.name] ?? [];
    for (const clubData of clubList) {
      const [club] = await db.insert(gfcClubsTable).values({
        name: clubData.name,
        leagueId: league.id,
        country: leagueData.country,
        city: clubData.city,
        colors: clubData.colors,
        stadiumName: clubData.stadium,
        stadiumCapacity: rnd(20000, 80000),
        description: `${clubData.name} is one of ${leagueData.country}'s most iconic clubs, based in ${clubData.city}.`,
        purchasePrice: clubData.price,
        currentValue: clubData.price,
        prestige: clubData.prestige,
        transferBudget: Math.floor(clubData.price * 0.15),
      }).returning();

      const players = generatePlayers(club.id, clubData.prestige);
      for (const p of players) {
        await db.insert(gfcPlayersTable).values(p);
      }
    }
  }

  const freeAgents = generateFreeAgents(40);
  for (const fa of freeAgents) {
    await db.insert(gfcPlayersTable).values(fa);
  }
}
