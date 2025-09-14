import express from "express";
import {createManager, getManager} from "../controllers/manager-controllers";

const router = express.Router();

router.get('/:cognitoId', getManager);
router.post('/', createManager);

export default router;
