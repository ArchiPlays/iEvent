const express = require('express')
const fs = require('fs')
const swish = require('swish-payment')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')
const bodyParser = require('body-parser')
const QRCode = require('qrcode')

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

let poolConfig = `smtps://${ process.env.NOTIFICATION_EMAIL }:${ process.env.EMAIL_PASSWORD }@smtp.gmail.com/?pool=true`;

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    auth: {
        type: "login", // default
        user: "archithecoder@gmail.com",
        pass: "bcs@2020#ssTestAccount"
    }
});

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
    }).status(401)

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
        if (err) console.error(err);

        return res.json({
            token: booking.token,
            timestamp: booking.timestamp,
            meal: booking.people.meal,
            people: booking.people
        })
    })
})

app.post('/updateBooking', express.json(), (req, res) => {
    for (const [personId, value] of Object.entries(req.body.values)) {
        if (personId == "") continue;
        booking.updateOne({ token: req.body.token }, { "$set": { ["people." + personId + ".eaten"]: value } }, (err, data) => {
            if (err) console.error(err)
        })
    }

    res.json({
        message: "Pog"
    })
})

app.get('/manageBookings', (req, res) => {
    res.render('view_all_bookings')
})

app.get('/getAllBookings', (req, res) => {
    booking.find({}, (err, data) => {
        res.send(data)
    })
})

app.post('/createBooking', express.json(), (req, res) => {
    // TO-DO on 2021-08-26: Test createBooking, and improvise product design and make it all send in one email if possible.

    if (!validateRequest(req, 0)) return res.json({
        message: "Invalid request"
    }).status(401)

    /* 
        {
            meals: [
                {
                    people: [
                        {
                            name: "Pinky Ray",
                            ageGroup: 3,
                            mealPref: "N"
                        },
                        {
                            name: "Arpan Ray",
                            ageGroup: 3,
                            mealPref: "N"
                        },
                        {
                            name: "Anisha Ray",
                            ageGroup: 2,
                            mealPref: "N"
                        }
                    ],
                    meal: "D1"
                },
                {
                    people: [
                        {
                            name: "Pinky Ray",
                            ageGroup: 3,
                            mealPref: "N"
                        },
                        {
                            name: "Arpan Ray",
                            ageGroup: 3,
                            mealPref: "N"
                        },
                        {
                            name: "Anisha Ray",
                            ageGroup: 2,
                            mealPref: "N"
                        }
                    ],
                    meal: "D2"
                }
            ]
        }
    */

    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

    let meals = []
    let paths = []

    for (let mealIt = 0; mealIt < req.body.meals.length; mealIt++) {
        let meal = req.body.meals[mealIt];
        let people = {}

        let mealToken = "";

        for (let i = 0; i < 12; i++) {
            mealToken += chars.charAt(Math.floor(Math.random() * chars.length))
        }

        for (let i = 0; i < meal.people.length; i++) {
            let personToAdd = meal.people[i];

            let name = personToAdd.name
            let ageGroup = personToAdd.ageGroup
            let mealPref = personToAdd.mealPref

            let pid = "";

            for (let i = 0; i < 10; i++) {
                pid += chars.charAt(Math.floor(Math.random() * chars.length))
            }

            people[pid] = {
                name: name,
                ageGroup: ageGroup,
                mealPref: mealPref,
                eaten: false
            }
        }

        people.meal = meal.meal

        meals.push({
            token: mealToken,
            email: req.body.email,
            people: people
        })
    }

    for (let i = 0; i < meals.length; i++) {
        let meal = meals[i]
        let token = meal.token;

        let newBooking = new booking(meal)

        newBooking.save()
        QRCode.toFile('./temp/' + token + ".png", "ievent://check-in?token=" + token)

        paths.push({
            filename: ((meal.people.meal.startsWith("L")) ? "Lunch" : "Dinner" + meal.people.meal.substr(1)) + ".png",
            path: __dirname + '\\temp\\' + token + ".png"
        })

        console.log(paths)
    }

    transporter.sendMail({
        subject: "Durgotsab Booking Confirmation",
        from: process.env.NOTIFICATION_EMAIL,
        to: req.body.email,
        attachments: paths,
        text: "Hey!\n\nWe have received your booking for Durgotsab 2021. \nHere are your booked food coupons!\n\nPlease do not delete this email. \n\nScan this code at the desk during food pickup.\n\nThank you!"
    })

    setTimeout(() => {
        for (let i = 0; i < paths.length; i++) {
            let file = paths[i]
            require('fs').unlinkSync(file.path)
        }
    }, 5000)

    res.send("Okay!")
})

const validateRequest = (req, min) => {
    if (req.query.length < min) return false;
    if (req.query.key == null) return false;
    if (req.query.key != "03fda7ca-862b-4558-bfe8-3e573dfd7cdc") return false;

    return true;
}

app.set('view engine', 'ejs')
app.use(express.static('public'))
