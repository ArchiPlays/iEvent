fetch('/getAllBookings').then(res => res.json()).then(data => {
    /*
        Element Template: 

        <div class="booking">
            <span class="booking-ref">A1BC8SJMW57V</span>
            <span class="meal-name">Lunch 1</span>
            <span class="email">dibyendu0710@gmail.com</span>
            <span class="name">Dibyendu Das</span>
            <span class="number-of-people">3</span>
        </div>
    */

    console.log(data)

    data.forEach(booking => {
        console.log(booking.people.meal)
        let container = document.createElement('tr')
        container.onclick = function () {
            window.location.replace('/modify_food_coupon_data?token=' + booking.token)
        }

        let br = document.createElement('td')
        br.innerHTML = booking.token

        let mn = document.createElement('td')

        let mealType = (booking.people.meal.startsWith("L")) ? "Lunch" : "Dinner"
        let dayNumber = booking.people.meal.substr(1)

        mn.innerHTML = `${mealType} ${dayNumber}`

        let email = document.createElement('td')
        email.innerHTML = booking.email

        let name = document.createElement('td')
        name.innerHTML = booking.people[Object.keys(booking.people)[0]].name

        let nop = document.createElement('td')
        nop.innerHTML = Object.keys(booking.people).length - 1

        container.appendChild(br)
        container.appendChild(mn)
        container.appendChild(email)
        container.appendChild(name)
        container.appendChild(nop)

        document.getElementById('bookings-list').appendChild(container)
    })
})