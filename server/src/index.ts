import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import {authMiddleware} from "./milddleware/auth-middleware";
/* ROUTE IMPORT */
import tenantsRoutes from "./routes/tenants-routes";
import managerRoutes from "./routes/managers-routes";

/* CONFIGURATIONS */
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

/* ROUTE USE */
app.get('/', (req, res) => {
  res.send('Home route is working!');
})

app.use('/tenants', authMiddleware(['tenant']), tenantsRoutes);
app.use('/managers', authMiddleware(['manager']), managerRoutes);

/* SERVER */
const port = process.env.PORT || 3003;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
