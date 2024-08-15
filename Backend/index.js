import express from "express";
import { PORT } from "./config.js";

const app = express();

app.listen(PORT, () => {
    console.log(`THE WEB IS LISENING TO PORT: ${PORT}`)
});