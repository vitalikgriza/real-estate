import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
/* ROUTE IMPORT */

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

/* SERVER */
const port = process.env.PORT || 3003;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
