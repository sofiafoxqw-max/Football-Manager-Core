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

export default router;
