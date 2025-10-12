import {Router} from "express";
import {getLeasePayments, getLeases} from "../controllers/lease-controllers";

const router = Router();

router.get('/', getLeases);
router.get('/:id/payments', getLeasePayments);


export default router;
