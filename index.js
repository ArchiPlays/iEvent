const express = require('express')
const fs = require('fs')
const swish = require('swish-payment')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')
const bodyParser = require('body-parser')

const app = express()
const { v4 } = require('uuid')

var privateKey = fs.readFileSync('ssl/localhost-key.pem', 'utf8');
var certificate = fs.readFileSync('ssl/localhost.pem', 'utf8');

var credentials = { key: privateKey, cert: certificate };
let booking = require('./schema/booking')

const swishAPI = swish.init({
    cert: {
        key: "./ssl/Swish_Merchant_TestSigningCertificate_1234679304.key",
        cert: "./ssl/Swish_Merchant_TestCertificate_1234679304.pem",
        ca: "./ssl/Swish_TLS_RootCA.pem",
        passphrase: "swish"
    },
    data: {
        payeeAlias: "+46725888063",
        currency: "SEK",
        callbackUrl: "https://81.234.196.119/transactionComplete"
    }
})

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NOTIFICATION_EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
})

app.listen(process.env.PORT || 5500, () => {
    console.log("Listening");
    dotenv.config();

    mongoose.connect(process.env.MONGODB_URI, {
        useUnifiedTopology: true,
        useFindAndModify: true,
        useNewUrlParser: true
    })

    console.log('Connected to DB!')
})

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/admin', (req, res) => {
    res.render('qr_reader')
})

app.get('/generatePaymentProtocol', (req, res) => {
    if (!validateRequest(req, 3)) return res.json({
        message: "Invalid request"
    }).status(403)

    let amount = req.query.amount;
    let message = req.query.message;
    let clientNumber = req.query.number;

    createPaymentRequest(amount, message, "https://81.234.196.119/transactionComplete").then(paymentDetails => {
        return res.json({
            token: paymentDetails.token,
            instructionUUID: paymentDetails.instructionUUID,
            message: "Success"
        })
    })
})

app.get('/test_qr', (req, res) => {
    res.sendFile(__dirname + '/public/assets/img/test_qr.png')
})

app.get('/modify_food_coupon_data', (req, res) => {
    return res.render('modify_food_coupon_data')
})

app.get('/getBooking', (req, res) => {
    let token = req.query.token;

    if (!token) return res.redirect('/admin')

    booking.findOne({ token: token }, (err, booking) => {
        return res.json(booking)
    })
})

app.post('/updateBooking', express.json(), (req, res) => {
    for (const [personId, value] of Object.entries(req.body.values)) {
        booking.updateOne({ token: req.body.token, 'people.personId': personId }, { "$set": { 'people.$.eaten': value } })
        console.log(personId, value)
    }

    res.json({
        message: "Pog"
    })

    // TO-DO: Fix accepting bodies in HTTP Request.
})

const validateRequest = (req, min) => {
    if (req.query.length < min) return false;
    if (req.query.key == null) return false;
    if (req.query.key != "03fda7ca-862b-4558-bfe8-3e573dfd7cdc") return false;

    return true;
}

app.set('view engine', 'ejs')
app.use(express.static('public'))
