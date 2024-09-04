// Encode message into the canvas
function encodeMessage() {
    const message = document.getElementById('messageInput').value;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Convert the message into chunks of 3 characters
    const chunks = [];
    for (let i = 0; i < message.length; i += 3) {
        let chunk = message.substring(i, i + 3);
        while (chunk.length < 3) chunk += '\0'; // Pad with null characters if needed
        chunks.push(chunk);
    }

    // Determine the size of the canvas
    const size = Math.ceil(Math.sqrt(chunks.length));
    
    // Determine the pixel size based on message length
    const pixelSize = message.length < 25 ? 20 : 10; // 20x20 for less than 25 characters, otherwise 10x10

    // Set the canvas size for display
    canvas.width = size * pixelSize;
    canvas.height = size * pixelSize;

    // Draw each chunk onto the canvas as a color block
    chunks.forEach((chunk, index) => {
        const x = (index % size) * pixelSize;
        const y = Math.floor(index / size) * pixelSize;
        const [r, g, b] = chunk.split('').map(c => c.charCodeAt(0));
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y, pixelSize, pixelSize);
    });

    // Scale up the canvas to fit the screen
    fitCanvasToScreen();
}

let originalImageWidth = 0;
let originalImageHeight = 0;
let scalingFactor = 1; // Default scaling factor

// Handle image upload and scaling
function loadImage() {
    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];
    
    if (file) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            
            originalImageWidth = img.width;
            originalImageHeight = img.height;
            
            // Determine the scaling factor
            scalingFactor = img.width < 25 ? 20 / img.width : 10 / img.width; // Adjust as needed
            
            // Set canvas size and draw the image
            canvas.width = img.width * scalingFactor;
            canvas.height = img.height * scalingFactor;
            ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
            
            // Store image data for download and copy operations
            const dataURL = canvas.toDataURL();
            document.getElementById('downloadCanvas').value = dataURL;
        };
        
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function decodeMessage() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let blockSize = 10; // Default block size

    // Detect block size
    const blockSizeCandidates = [20, 10]; // Possible block sizes
    for (let size of blockSizeCandidates) {
        let found = false;
        outerLoop: for (let y = 0; y < height; y += size) {
            for (let x = 0; x < width; x += size) {
                // Get color of the top-left pixel in the block
                const r0 = data[(y * width + x) * 4];
                const g0 = data[(y * width + x) * 4 + 1];
                const b0 = data[(y * width + x) * 4 + 2];
                
                // Check if all pixels in the block are the same color
                for (let dy = 0; dy < size; dy++) {
                    for (let dx = 0; dx < size; dx++) {
                        const index = ((y + dy) * width + (x + dx)) * 4;
                        if (data[index] !== r0 || data[index + 1] !== g0 || data[index + 2] !== b0) {
                            continue outerLoop;
                        }
                    }
                }
                // If we found a block of uniform color, set block size
                blockSize = size;
                found = true;
                break outerLoop;
            }
        }
        if (found) break;
    }

    // Calculate the original dimensions based on detected block size
    const originalWidth = Math.round(width / blockSize);
    const originalHeight = Math.round(height / blockSize);

    let decodedMessage = '';
    // Decode the image data
    for (let y = 0; y < originalHeight; y++) {
        for (let x = 0; x < originalWidth; x++) {
            const index = (y * blockSize * width + x * blockSize) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const char1 = String.fromCharCode(r);
            const char2 = String.fromCharCode(g);
            const char3 = String.fromCharCode(b);
            decodedMessage += char1 + char2 + char3;
        }
    }

    // Remove padding characters
    decodedMessage = decodedMessage.replace(/\0/g, '');

    // Get decodedContainer and decodedMessage elements
    const decodedContainer = document.getElementById('decodedContainer');
    const decodedMessageElement = document.getElementById('decodedMessage');

    // Debugging
    console.log('Decoded message:', decodedMessage);
    console.log('Decoded container class list:', decodedContainer.classList);

    // Update decodedMessage element with the decoded message
    decodedMessageElement.textContent = decodedMessage;

    // Show or hide decodedContainer based on content
    if (decodedMessage) {
        decodedContainer.classList.remove('hidden');
        decodedContainer.classList.add('visible');
    } else {
        decodedContainer.classList.remove('visible');
        decodedContainer.classList.add('hidden');
    }
}




// Fit canvas to screen with scaling factor
function fitCanvasToScreen() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.9;
    
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    
    // Determine the scale factor
    let scale = 1;
    if (originalWidth > maxWidth) {
        scale = maxWidth / originalWidth;
    }
    if (originalHeight * scale > maxHeight) {
        scale = maxHeight / originalHeight;
    }
    
    // Apply an additional scale factor to make the canvas image larger
    const additionalScaleFactor = 1; // Adjust this value as needed
    scale *= additionalScaleFactor;

    // Set new dimensions based on scale factor
    let width = originalWidth * scale;
    let height = originalHeight * scale;
    
    // Ensure dimensions do not exceed the max size
    if (width > maxWidth) {
        width = maxWidth;
        height = (originalHeight * scale * maxWidth) / (originalWidth * scale);
    }
    if (height > maxHeight) {
        height = maxHeight;
        width = (originalWidth * scale * maxHeight) / (originalHeight * scale);
    }
    
    // Apply styles to scale up the canvas
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
}
// Download image
function downloadImage() {
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error("Canvas element not found.");
        return;
    }

    canvas.toBlob(blob => {
        if (!blob) {
            console.error("Failed to convert canvas to Blob.");
            return;
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'encoded_image.png';
        document.body.appendChild(link); // Append the link to the body
        link.click();
        document.body.removeChild(link); // Clean up

        // Optionally, revoke the object URL after the download
        URL.revokeObjectURL(link.href);
    }, 'image/png');
}


// Copy image to clipboard
function copyImage() {
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error("Canvas element not found.");
        return;
    }

    canvas.toBlob(blob => {
        if (!blob) {
            console.error("Failed to convert canvas to Blob.");
            return;
        }

        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item])
            .then(() => console.log("Image copied to clipboard"))
            .catch(err => console.error("Failed to copy image to clipboard", err));
    }, 'image/png');
}

// Add an event listener for the resize event to fit the canvas to screen
window.addEventListener('resize', fitCanvasToScreen);
