const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.send("I am Working");
});

app.get("/hello", (req, res) => {
    res.send("hello World, This is a new route");
})
app.listen(8000, () => {
    console.log("Sercer is running")
});