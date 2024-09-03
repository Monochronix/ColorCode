// Global variables
let canvas, ctx;

// Initialize canvas
function initCanvas() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
}

// Resize canvas to fit the number of pixels needed
function resizeCanvas(width, height) {
    canvas.width = width;
    canvas.height = height;
}

// Encode message into colors
function encodeMessage() {
    const input = document.getElementById('messageInput').value;
    const totalPixels = Math.ceil(input.length / 3);
    const width = Math.ceil(Math.sqrt(totalPixels));
    const height = Math.ceil(totalPixels / width);

    resizeCanvas(width, height);
    const imageData = ctx.createImageData(width, height);

    for (let i = 0; i < totalPixels; i++) {
        const baseIndex = i * 4;
        let r = 0, g = 0, b = 0;

        // Get the characters for the current pixel
        const chunk = input.slice(i * 3, i * 3 + 3);
        if (chunk.length > 0) r = chunk.charCodeAt(0);
        if (chunk.length > 1) g = chunk.charCodeAt(1);
        if (chunk.length > 2) b = chunk.charCodeAt(2);

        imageData.data[baseIndex] = r; // Red
        imageData.data[baseIndex + 1] = g; // Green
        imageData.data[baseIndex + 2] = b; // Blue
        imageData.data[baseIndex + 3] = 255; // Alpha
    }

    ctx.putImageData(imageData, 0, 0);
}


// Decode colors from the image
function decodeMessage() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let message = '';

    for (let i = 0; i < data.length; i += 4) { // Process 1 pixel at a time
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert RGB values to characters
        if (r > 0) message += String.fromCharCode(r);
        if (g > 0) message += String.fromCharCode(g);
        if (b > 0) message += String.fromCharCode(b);
    }

    // Handle trailing null characters
    message = message.replace(/\0+$/, '');

    document.getElementById('decodedMessage').textContent = message;
}



// Download the canvas image
function downloadImage() {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'encoded-image.png';
    link.click();
}

// Copy the canvas image to clipboard
function copyImage() {
    canvas.toBlob(blob => {
        const item = new ClipboardItem({'image/png': blob});
        navigator.clipboard.write([item]);
    });
}

// Upload and display an image
function loadImage() {
    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const imgWidth = img.width;
            const imgHeight = img.height;
            resizeCanvas(imgWidth, imgHeight);
            ctx.clearRect(0, 0, imgWidth, imgHeight);
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
        }
        img.src = event.target.result;
    }

    reader.readAsDataURL(file);
}

// Initialize canvas on page load
window.onload = function() {
    initCanvas();
}
