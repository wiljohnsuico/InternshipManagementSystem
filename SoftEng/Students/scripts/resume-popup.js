var modal = document.getElementById("popupModal");
var btn = document.getElementById("openPopup");
var closeBtn = document.querySelector(".close");

btn.onclick = function() {
    modal.style.display = "flex";
}

closeBtn.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
} 