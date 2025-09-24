import {Router} from "express";
import {getLeasePayments, getLeases} from "../controllers/lease-controllers";
import {authMiddleware} from "../milddleware/auth-middleware";

const router = Router();

router.get('/', getLeases);
router.get('/:id/payments', authMiddleware(['manager', 'tenant']), getLeasePayments);


export default router;
