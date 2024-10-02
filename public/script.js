

let i = 0;
let text = "Our Wedding";
setTimeout(function typing() {
    if (i < text.length) {
        document.getElementById('text').innerHTML += text.charAt(i);
        i++;
        setTimeout(typing, 90);
    }
}, 1500);

$(document).ready(function () {
    new ScrollFlow();
});


let i1 = 0;
let text1 ='" Bruno and Tomas "';
setTimeout(function typing() {
    if (i1 < text1.length) {
        document.getElementById('text1').innerHTML += text1.charAt(i1);
        i1++;
        setTimeout(typing, 90);
    }
}, 1500);

$(document).ready(function () {
    new ScrollFlow();
});

 // Reproduce el audio automáticamente después de un breve retraso
 document.addEventListener("DOMContentLoaded", function () {
    var audio = document.getElementById("background-music");
    audio.volume = 0.3; // Ajusta el volumen a un nivel más audible
    audio.play().catch(function(error) {
        console.log('Error al intentar reproducir el audio: ', error);
    });

    // Control de reproducción y pausa
    var playPauseButton = document.getElementById("play-pause");
    playPauseButton.addEventListener("click", function () {
        if (audio.paused) {
            audio.play();
            playPauseButton.textContent = "Pause Music"; // Cambiar el texto del botón
        } else {
            audio.pause();
            playPauseButton.textContent = "Play Music"; // Cambiar el texto del botón
        }
    });
});