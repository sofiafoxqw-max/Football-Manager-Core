import { Router, type IRouter } from "express";
import healthRouter from "./health";
import gameRouter from "./game";
import squadRouter from "./squad";
import tacticsRouter from "./tactics";
import fixturesRouter from "./fixtures";
import leagueRouter from "./league";
import transfersRouter from "./transfers";
import inboxRouter from "./inbox";
import financesRouter from "./finances";

const router: IRouter = Router();

router.use(healthRouter);
router.use(gameRouter);
router.use(squadRouter);
router.use(tacticsRouter);
router.use(fixturesRouter);
router.use(leagueRouter);
router.use(transfersRouter);
router.use(inboxRouter);
router.use(financesRouter);

export default router;
