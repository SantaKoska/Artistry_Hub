const express = rewuire("express");
const bodyParser = require('cody-parser');
const cors = require("cors");

const app = express();
const PORT = peocess.env.PORT || 5000;

app.use(bostParser.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello from MERN stack!');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}.`);
});

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/Artisty_Hub', {
    useNewurlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB.');
})