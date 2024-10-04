// Script.js


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

async function deletePhoto(photoId) {
    if (confirm('Are you sure you want to delete this image?')) {
      try {
        const response = await fetch(`/delete-photo/${photoId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          alert(data.message); // Mostrar la alerta de éxito
          location.reload(); // Recargar la página
        } else {
          alert(data.message || 'Error deleting image');
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        alert('Error deleting image');
      }
    }
  }

  function confirmDelete(event) {
    // Evitar que el formulario se envíe inmediatamente
    event.preventDefault();
    
    // Enviar la solicitud AJAX para eliminar la foto
    const form = event.target; // Obtener el formulario que fue enviado
    const url = form.action; // Obtener la URL de acción del formulario

    // Hacer la solicitud AJAX
    fetch(url, {
        method: 'DELETE', // Cambia a 'DELETE' para eliminar
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (response.ok) {
            alert('🗑️ Hello Bruno and Tomas, image deleted successfully!'); // Alerta de éxito
            // Recargar la página para reflejar el cambio
            window.location.reload();
        } else {
            return response.json().then(data => {
                alert(`🚫 ${data.message}`); // Mostrar mensaje de error
            });
        }
    })
    .catch(error => {
        console.error('Error deleting image:', error);
        alert('❌ Only the administrator can delete the image!'); // Mensaje de error por defecto
    });
}

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevenir el envío del formulario por defecto
  
    const formData = new FormData(this);
    const data = new URLSearchParams(formData);
  
    try {
      const response = await fetch('/login', {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
  
      if (response.ok) {
        // Redirigir a la página principal si la autenticación es exitosa
        window.location.href = '/';
      } else {
        const errorData = await response.json();
        alert(errorData.error); // Mostrar alerta en caso de error
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
      alert('An error occurred. Please try again.'); // Manejo de errores de red
    }
  });

  function openModal(imageUrl) {
    const modalImage = document.getElementById('modalImage');
    modalImage.src = imageUrl;

    // Inicializar y mostrar el modal
    const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
    imageModal.show();
}



// script.js

// script.js

document.getElementById('uploadForm').addEventListener('submit', function(event) {
  event.preventDefault(); // Evitar el envío del formulario por defecto

  const formData = new FormData(this); // Obtener los datos del formulario

  fetch('/upload', {
      method: 'POST',
      body: formData, // Asegúrate de enviar los archivos en un FormData
  })
  .then(response => response.json())
  .then(data => {
      if (data.error) {
          alert(data.error); // Mostrar el mensaje de error en una alerta
      } else {
          window.location.href = '/'; // Redirigir a la galería si no hay error
      }
  })
  .catch(error => {
      console.error('Error:', error);
      alert('❌ An error occurred while uploading the images. ❌');
  });
});

