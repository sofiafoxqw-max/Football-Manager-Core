import { Router } from "express";
import { db } from "@workspace/db";
import { gameStateTable, fixturesTable, clubsTable, playersTable } from "@workspace/db";
import { eq, and, gt, asc } from "drizzle-orm";

const router = Router();

const PRE_MATCH_QUESTIONS = [
  {
    id: 1,
    question: "How are you feeling about the upcoming match?",
    context: "pre_match",
    options: [
      { id: "a", text: "We're fully prepared and confident we'll get the result.", tone: "confident" },
      { id: "b", text: "It's a tough game but we'll give everything we've got.", tone: "humble" },
      { id: "c", text: "We respect the opponent but we're focused on our own game.", tone: "neutral" },
      { id: "d", text: "I expect nothing less than three points.", tone: "aggressive" },
    ],
  },
  {
    id: 2,
    question: "How has the squad been training this week?",
    context: "pre_match",
    options: [
      { id: "a", text: "The lads have been brilliant in training. Energy is high.", tone: "positive" },
      { id: "b", text: "We've had some good sessions and worked on key areas.", tone: "neutral" },
      { id: "c", text: "There are some concerns about fitness but we'll manage.", tone: "neutral" },
      { id: "d", text: "I won't give away our preparations to the opposition.", tone: "dismissive" },
    ],
  },
  {
    id: 3,
    question: "Any injury updates ahead of the match?",
    context: "pre_match",
    options: [
      { id: "a", text: "We have a clean bill of health, everyone is available.", tone: "positive" },
      { id: "b", text: "We have a couple of doubts but I expect them to be fine.", tone: "neutral" },
      { id: "c", text: "We're managing a few knocks but we have squad depth.", tone: "neutral" },
      { id: "d", text: "I won't be discussing our squad availability publicly.", tone: "dismissive" },
    ],
  },
];

const POST_MATCH_QUESTIONS_WIN = [
  {
    id: 4,
    question: "A fine result today — what were the key factors?",
    context: "post_match",
    options: [
      { id: "a", text: "The players were outstanding, they carried out the gameplan perfectly.", tone: "positive" },
      { id: "b", text: "Collective effort — every single player gave everything today.", tone: "positive" },
      { id: "c", text: "We identified their weaknesses and exploited them well.", tone: "confident" },
      { id: "d", text: "Three points is all that matters at this stage.", tone: "neutral" },
    ],
  },
  {
    id: 5,
    question: "How pleased are you with the performance?",
    context: "post_match",
    options: [
      { id: "a", text: "I'm delighted — this is exactly the level we need to maintain.", tone: "positive" },
      { id: "b", text: "There are still areas to improve but the result was what counted.", tone: "neutral" },
      { id: "c", text: "Very pleased, the squad is growing in confidence every week.", tone: "positive" },
      { id: "d", text: "I've seen better from us but I'll take the win.", tone: "neutral" },
    ],
  },
];

const POST_MATCH_QUESTIONS_LOSS = [
  {
    id: 6,
    question: "A disappointing result. What went wrong?",
    context: "post_match",
    options: [
      { id: "a", text: "We weren't good enough today and I take full responsibility.", tone: "humble" },
      { id: "b", text: "We made costly mistakes that a team at this level can't afford.", tone: "neutral" },
      { id: "c", text: "The referee's decisions made our task much harder.", tone: "aggressive" },
      { id: "d", text: "The players gave everything but it wasn't our day.", tone: "neutral" },
    ],
  },
  {
    id: 7,
    question: "How do you react to this defeat?",
    context: "post_match",
    options: [
      { id: "a", text: "We dust ourselves off and work harder in training this week.", tone: "positive" },
      { id: "b", text: "There will be serious conversations in the dressing room.", tone: "aggressive" },
      { id: "c", text: "One defeat doesn't define us. We'll bounce back.", tone: "encourage" },
      { id: "d", text: "I need to look at the footage carefully before commenting further.", tone: "dismissive" },
    ],
  },
];

router.get("/press-conference", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  // Find next fixture
  const [nextFixture] = await db.select().from(fixturesTable)
    .where(and(
      eq(fixturesTable.status, "scheduled"),
      gt(fixturesTable.week, state.currentWeek ?? 0),
    ))
    .orderBy(asc(fixturesTable.week))
    .limit(1);

  if (!nextFixture) {
    return res.json({ type: "general", questions: PRE_MATCH_QUESTIONS.slice(0, 2), opponentName: null });
  }

  const clubs = await db.select({ id: clubsTable.id, name: clubsTable.name }).from(clubsTable);
  const clubMap = Object.fromEntries(clubs.map(c => [c.id, c.name]));
  const opponentId = nextFixture.homeClubId === state.clubId ? nextFixture.awayClubId : nextFixture.homeClubId;
  const opponentName = clubMap[opponentId] ?? "the opponent";

  return res.json({
    type: "pre_match",
    questions: PRE_MATCH_QUESTIONS,
    opponentName,
  });
});

router.post("/press-conference/answer", async (req, res) => {
  const { questionId, optionId } = req.body as { questionId: number; optionId: string };

  const allQuestions = [...PRE_MATCH_QUESTIONS, ...POST_MATCH_QUESTIONS_WIN, ...POST_MATCH_QUESTIONS_LOSS];
  const question = allQuestions.find(q => q.id === questionId);
  if (!question) return res.status(404).json({ error: "Question not found" });

  const option = question.options.find(o => o.id === optionId);
  if (!option) return res.status(400).json({ error: "Invalid option" });

  const positiveEffect = ["positive", "confident", "motivate"].includes(option.tone);
  const negativeEffect = ["aggressive", "dismissive"].includes(option.tone);

  const moraleEffect = positiveEffect ? "positive" : negativeEffect ? "negative" : "neutral";
  const moraleChange = positiveEffect ? 2 : negativeEffect ? -1 : 0;

  const messages: Record<string, string> = {
    positive: "Your positive response boosted squad morale.",
    negative: "Some players were unsettled by your tone.",
    neutral: "The squad took note of your composed response.",
  };

  return res.json({ moraleEffect, message: messages[moraleEffect], moraleChange });
});

export default router;
