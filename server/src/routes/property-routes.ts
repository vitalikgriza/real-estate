import express from 'express';
import {authMiddleware} from "../milddleware/auth-middleware";
import multer from "multer";
import {createProperty, getProperties, getProperty, getPropertyLeases} from "../controllers/property-controllers";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', getProperties);
router.get('/:id', getProperty);
router.get('/:id/leases', getPropertyLeases);
router.post('/',
    authMiddleware(['manager']),
    upload.array('photos'),
  createProperty);

export default router;
