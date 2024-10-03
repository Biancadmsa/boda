window.onload = function() {
    const heroSection = document.querySelector('.hero-section');
    const img = new Image();
    img.src = '/image/boda2.webp';
    img.onload = function() {
        heroSection.style.backgroundImage = 'url("/image/boda2.webp")';
    };
};

document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault(); // Evita el comportamiento por defecto de envío para mostrar el alert primero
    
    // Crea un objeto FormData para enviar los datos del formulario
    const formData = new FormData(this);

    // Enviar la solicitud con fetch
    fetch(this.action, {
        method: 'POST',
        body: formData
    }).then(response => {
        if (response.ok) {
            const message = '"Thank you so much! You are wonderful, and we appreciate you joining us at our wedding😊🎉!!!!"';
            alert(message); // Mostrar el alert

            // Recargar la página después de cerrar el alert
            setTimeout(() => {
                window.onload(); // Simular el evento onload
                location.reload(); // Recargar la página
            }, 100); // Esperar un breve momento (100 ms)

            this.reset(); // Opcional: restablece el formulario después del envío
        } else {
            alert("Oops! Something went wrong. Please try again.");
        }
    }).catch(error => {
        console.error('Error:', error);
        alert("There was an error uploading the photo. Please try again.");
    });
});

document.getElementById('photos').addEventListener('change', function() {
    if (this.files.length > 10) {
        alert("You can only upload a maximum of 10 photos.");
        this.value = ""; // Limpiar el campo de entrada
    }
});
