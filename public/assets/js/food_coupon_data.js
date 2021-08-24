let searchParams = new URLSearchParams(window.location.search)

console.log('/getBooking?token=' + searchParams.get('token'))

fetch('/getBooking?token=' + searchParams.get('token')).then(res => res.json()).then(booking => {
    console.log(booking)
    for (let person in booking.people) {
        let em = document.createElement('input')
        em.type = "checkbox"
        em.name = booking.people[person].personId
        em.style.width = "15px"
        em.style.height = "15px"
        em.checked = booking.people[person].eaten

        let mealPref = (booking.people[person].mealPref == "V") ? "Vegetarian" : "Non-Vegetarian";

        let label = document.createElement('label')
        label.for = booking.people[person].name
        label.textContent = booking.people[person].name + " has eaten this meal - " + mealPref
        label.style.marginLeft = "10px"
        label.style.fontSize = "20px"

        document.getElementById('tick_aten').appendChild(em)
        document.getElementById('tick_aten').appendChild(label)
        document.getElementById('tick_aten').appendChild(document.createElement('br'))
    }

    let sm = document.createElement('input')
    sm.type = "submit"
    sm.value = "Submit"
    sm.style.marginTop = "20px"

    document.getElementById('tick_aten').appendChild(sm)

    let mealType = (booking.meal.startsWith("L")) ? "Lunch" : "Dinner"
    let dayNumber = booking.meal.substr(1)

    document.getElementById('meal-name').textContent = mealType + " Day " + dayNumber + " - Booking Reference #" + searchParams.get('token')
})

document.getElementById('tick_aten').addEventListener('submit', (ev => {
    ev.preventDefault()

    let values = {}

    let checkboxes = document.getElementsByTagName('input')

    for (let i = 0; i < checkboxes.length; i++) {
        let elem = checkboxes[i]

        if (!elem.type == "checkbox") continue

        values[elem.name] = elem.checked
    }

    let http = new XMLHttpRequest()
    http.open('POST', '/updateBooking')
    http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    http.send(JSON.stringify({
        values: values,
        token: searchParams.get('token')
    }))
}))
