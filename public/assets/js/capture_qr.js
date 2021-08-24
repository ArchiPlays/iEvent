function onScanSuccess(decodedText, decodedResult) {
    // handle the scanned code as you like, for example:
    if (!decodedText.includes('ievent://check-in')) alert('Invalid check-in token. Please retry.')
    window.location.href = "/modify_food_coupon_data?token=" + decodedText.replace('ievent://check-in?token=', '');
}

function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning.
    // for example:
    console.warn(`Code scan error: ${ error }`);
}

let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader", { fps: 10, qrbox: 250 }, /* verbose= */ true);
html5QrcodeScanner.render(onScanSuccess, onScanFailure);

let elements = document.getElementsByTagName('a')

for (let i = 0; i < elements.length; i++) {
    let element = elements[i]
    if (element.href == "https://github.com/mebjas/html5-qrcode") {
        element.remove();
    }
}
