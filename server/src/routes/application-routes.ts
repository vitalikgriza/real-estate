import {Router} from "express";
import {authMiddleware} from "../milddleware/auth-middleware";
import {createApplication, listApplications, updateApplicationStatus} from "../controllers/application-controllers";

const router = Router();

router.get('/', authMiddleware(['manager', 'tenant']), listApplications);
router.post('/', authMiddleware(['tenant']), createApplication);
router.put('/:id/status', authMiddleware(['manager']), updateApplicationStatus);

export default router;
