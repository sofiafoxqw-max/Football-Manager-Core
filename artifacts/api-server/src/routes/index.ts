import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./gfc/auth";
import leaguesRouter from "./gfc/leagues";
import clubsRouter from "./gfc/clubs";
import playersRouter from "./gfc/players";
import contractsRouter from "./gfc/contracts";
import transfersRouter from "./gfc/transfers";
import economyRouter from "./gfc/economy";
import dashboardRouter from "./gfc/dashboard";

import gameRouter from "./game";
import squadRouter from "./squad";
import tacticsRouter from "./tactics";
import trainingRouter from "./training";
import fixturesRouter from "./fixtures";
import fmTransfersRouter from "./transfers";
import staffRouter from "./staff";
import inboxRouter from "./inbox";
import scoutingRouter from "./scouting";
import setPiecesRouter from "./setpieces";
import matchdayRouter from "./matchday";
import pressconfRouter from "./pressconf";
import financesRouter from "./finances";
import leagueRouter from "./league";
import injuriesRouter from "./injuries";
import fmContractsRouter from "./contracts";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/leagues", leaguesRouter);
router.use("/clubs", clubsRouter);
router.use("/players", playersRouter);
router.use("/contracts", contractsRouter);
router.use("/transfers", transfersRouter);
router.use("/economy", economyRouter);
router.use("/dashboard", dashboardRouter);

router.use(gameRouter);
router.use(squadRouter);
router.use(tacticsRouter);
router.use(trainingRouter);
router.use(fixturesRouter);
router.use(fmTransfersRouter);
router.use(staffRouter);
router.use(inboxRouter);
router.use(scoutingRouter);
router.use(setPiecesRouter);
router.use(matchdayRouter);
router.use(pressconfRouter);
router.use(financesRouter);
router.use(leagueRouter);
router.use(injuriesRouter);
router.use(fmContractsRouter);

export default router;
