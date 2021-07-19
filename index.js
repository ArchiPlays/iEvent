const express = require("express");

const app = express()

app.listen(80, () => {
    console.log("Listening on default browse port...")
})

app.get('/', (req, res) => res.render('home'));

app.set('view engine', 'ejs')
