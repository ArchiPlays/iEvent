let searchParams = new URLSearchParams(window.location.search)

fetch('/getBooking?token=' + searchParams.get('token')).then(res => res.json()).then(booking => {
    let keys = Object.keys(booking.people);
    console.log(booking)

    for (let i = 0; i < keys.length; i++) {
        if (keys[i] == "meal") continue;
        let person = booking.people[keys[i]]

        console.log(booking.people, person)

        let em = document.createElement('input')
        em.type = "checkbox"
        em.name = keys[i]
        em.style.width = "15px"
        em.style.height = "15px"
        em.checked = person.eaten

        let mealPref = (person.mealPref == "V") ? "Vegetarian" : "Non-Vegetarian";

        let ageGroup = "Age <5"
        switch (person.ageGroup) {
            case 0:
                break;
            case 1:
                ageGroup = "Age 5-15"
                break;
            case 2:
                ageGroup = "Age 15-18"
                break;
            case 3:
                ageGroup = "Adult"
                break;
        }

        let label = document.createElement('label')
        label.for = person.name
        label.textContent = `${person.name} (Age Group: ${ageGroup}) has eaten this ${mealPref} meal`
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

    let mealType = (booking.people.meal.startsWith("L")) ? "Lunch" : "Dinner"
    let dayNumber = booking.people.meal.substr(1)

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
