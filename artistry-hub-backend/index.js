const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.send("I am Working");
});

app.listen(8000, () => {
    console.log("Sercer is running")
});