const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now()
    },
    email: String,
    token: String,
    people: Object,
    meal: String
})

/* 
    Example People Array:
        {
            name: "Dibyendu Das",
            ageGroup: 2,
            bookedMeals: {
                lunch1: "V",
                lunch2: "V",
                dinner1: "N",
                dinner2: "N"
            }
        },
        {
            name: "Archisman Das",
            ageGroup: 1,
            bookedMeals: {
                lunch1: "N",
                lunch2: "N",
                dinner1: "N",
                dinner2: "N"
            }
        }
*/

module.exports = mongoose.model('registrations', schema)