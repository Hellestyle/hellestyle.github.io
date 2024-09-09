
let selectedImageId = '';

// Function to select an image
function selectImage(imageId) {
    // Clear previous selection
    const images = document.querySelectorAll('.image-container img');
    images.forEach(img => img.classList.remove('selected'));

    // Highlight the selected image
    const selectedImage = document.getElementById(imageId);
    selectedImage.classList.add('selected');

    // Store the selected image's ID
    selectedImageId = imageId;
}

// Function to handle submission
function submitSelection() {
    if (selectedImageId) {
        // Get the image element
        const selectedImage = document.getElementById(selectedImageId);
        
        // Display the selected image and its ID
        const resultText = `You selected: ${selectedImage.alt}`;
        document.getElementById('selected-result').textContent = resultText;

        // Here you can also use the `selectedImageId` or the image URL for further JavaScript logic
        console.log("Selected Image ID: " + selectedImageId);
    } else {
        alert("Please select an image!");
    }
}

function applyRegionGrowing() {
    
    

    // Get the selected image element
    const selectedImage = document.getElementById(selectedImageId);
    // Get the canvas and context
    const originalCanvas = document.getElementById('originalCanvasR');
    const segmentedCanvas = document.getElementById('regiongrowingCanvas');
    const originalCtx = originalCanvas.getContext('2d');
    const segmentedCtx = segmentedCanvas.getContext('2d');

    // Load the image
    const img = new Image();
    //img.src = 'minions.png'; // Path to the image file
    img.src = selectedImage.src;
    img.onload = () => {
        // Set canvas sizes
        originalCanvas.width = img.width;
        originalCanvas.height = img.height;
        segmentedCanvas.width = img.width;
        segmentedCanvas.height = img.height;

        // Draw the image on the original canvas
        originalCtx.drawImage(img, 0, 0, originalCanvas.width, originalCanvas.height);

        // Get image data
        const imageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
        const data = imageData.data;

        // Convert to grayscale
        const grayData = new Uint8Array(originalCanvas.width * originalCanvas.height);
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            grayData[i / 4] = 0.3 * r + 0.59 * g + 0.11 * b; // Simple grayscale conversion
        }

        // Perform region growing
        const segmentedData = regionGrowing(grayData, img.width, img.height);

        // Convert segmented data to image data
        const result = new Uint8ClampedArray(data.length);
        for (let i = 0; i < segmentedData.length; i++) {
            const color = segmentedData[i];
            if (color) {
                result[i * 4] = color[0]; // R
                result[i * 4 + 1] = color[1]; // G
                result[i * 4 + 2] = color[2]; // B
            } else {
                result[i * 4] = 0; // R
                result[i * 4 + 1] = 0; // G
                result[i * 4 + 2] = 0; // B
            }
            result[i * 4 + 3] = 255; // A
        }

        // Update the segmented canvas with the processed data
        segmentedCtx.putImageData(new ImageData(result, segmentedCanvas.width, segmentedCanvas.height), 0, 0);
    };
}

function regionGrowing(grayData, width, height) {
    const segmentedData = new Array(width * height).fill(null); // Stores color for each pixel
    const visited = new Uint8Array(width * height);
    const stack = [];

    const threshold = 20; // Threshold for region growth
    const numRegions = 10; // Number of regions to generate

    let regionCount = 0;

    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1] // 4-connected neighbors
    ];

    function inBounds(x, y) {
        return x >= 0 && x < width && y >= 0 && y < height;
    }

    function growRegion(seedX, seedY, currentColor) {
        stack.push([seedX, seedY]);
        segmentedData[seedY * width + seedX] = currentColor;
        visited[seedY * width + seedX] = 1;

        while (stack.length > 0) {
            const [x, y] = stack.pop();

            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;

                if (inBounds(nx, ny)) {
                    const index = ny * width + nx;
                    if (!visited[index] && Math.abs(grayData[index] - grayData[seedY * width + seedX]) < threshold) {
                        segmentedData[index] = currentColor;
                        visited[index] = 1;
                        stack.push([nx, ny]);
                    }
                }
            }
        }
    }

    // Generate random seed points and grow regions
    while (regionCount < numRegions) {
        let seedX = Math.floor(Math.random() * width);
        let seedY = Math.floor(Math.random() * height);
        const seedIndex = seedY * width + seedX;

        if (!visited[seedIndex] && !segmentedData[seedIndex]) {
            const currentColor = getRandomColor();
            growRegion(seedX, seedY, currentColor);
            regionCount++;
        }
    }

    // Debugging info
    console.log(`Region Count: ${regionCount}`);
    return segmentedData;
}

function getRandomColor() {
    // Generate a random color
    return [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
}

function applyThresholding() {
   

    // Get the selected image element
    const selectedImage = document.getElementById(selectedImageId);
    // Get the canvases and contexts
    const originalCanvas = document.getElementById('originalCanvasT');
    const originalCtx = originalCanvas.getContext('2d');
    const segmentedCanvas = document.getElementById('thresholdCanvas');
    const segmentedCtx = segmentedCanvas.getContext('2d');

    // Load the image
    const img = new Image();
    img.src = selectedImage.src; // Path to the new image file
    img.onload = () => {
        // Set canvas sizes
        originalCanvas.width = img.width;
        originalCanvas.height = img.height;
        segmentedCanvas.width = img.width;
        segmentedCanvas.height = img.height;

        // Draw the original image
        originalCtx.drawImage(img, 0, 0, originalCanvas.width, originalCanvas.height);

        // Get image data
        const imageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
        const data = imageData.data;

        // Convert to grayscale
        const grayData = new Uint8Array(originalCanvas.width * originalCanvas.height);
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            grayData[i / 4] = 0.3 * r + 0.59 * g + 0.11 * b; // Simple grayscale conversion
        }

        // Perform thresholding segmentation
        const threshold = 128; // You can adjust this value
        const segmentedData = segmentImage(grayData, originalCanvas.width, originalCanvas.height, threshold);

        // Convert segmented data to image data
        const result = new Uint8ClampedArray(data.length);
        for (let i = 0; i < segmentedData.length; i++) {
            const value = segmentedData[i] ? 255 : 0; // Set segmented pixels to white, others to black
            result[i * 4] = value; // R
            result[i * 4 + 1] = value; // G
            result[i * 4 + 2] = value; // B
            result[i * 4 + 3] = 255; // A
        }

        // Update the segmented canvas with the processed data
        segmentedCtx.putImageData(new ImageData(result, segmentedCanvas.width, segmentedCanvas.height), 0, 0);
    };
}

function segmentImage(grayData, width, height, threshold) {
    const segmentedData = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixelIndex = y * width + x;
            const pixelValue = grayData[pixelIndex];
            segmentedData[pixelIndex] = pixelValue >= threshold ? 1 : 0; // Apply thresholding
        }
    }

    return segmentedData;
}


function applyWatershed() {
    

    // Get the selected image element
    const selectedImage = document.getElementById(selectedImageId);
    const originalCanvas = document.getElementById('originalCanvasW');
    const originalCtx = originalCanvas.getContext('2d');
    const watershedCanvas = document.getElementById('watershedCanvas');
    const watershedCtx = watershedCanvas.getContext('2d');

    const img = new Image();
    img.src = selectedImage.src; // Path to the image file ------------------------------------------------------------------------------------
    img.onload = () => {
        // Set canvas sizes
        originalCanvas.width = img.width;
        originalCanvas.height = img.height;
        watershedCanvas.width = img.width;
        watershedCanvas.height = img.height;

        // Draw the original image
        originalCtx.drawImage(img, 0, 0, originalCanvas.width, originalCanvas.height);

        // Get image data
        const imageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
        const data = imageData.data;

        // Convert to grayscale
        const grayData = new Uint8Array(originalCanvas.width * originalCanvas.height);
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            grayData[i / 4] = 0.3 * r + 0.59 * g + 0.11 * b; // Simple grayscale conversion
        }

        // Perform edge detection
        const edgeData = detectEdges(grayData, originalCanvas.width, originalCanvas.height);

        // Convert edge data to image data
        const result = new Uint8ClampedArray(data.length);
        for (let i = 0; i < edgeData.length; i++) {
            const value = edgeData[i] ? 255 : 0; // Set edge pixels to white, others to black
            result[i * 4] = value; // R
            result[i * 4 + 1] = value; // G
            result[i * 4 + 2] = value; // B
            result[i * 4 + 3] = 255; // A
        }

        // Update the watershed canvas with the processed data
        watershedCtx.putImageData(new ImageData(result, watershedCanvas.width, watershedCanvas.height), 0, 0);
    };
}

function detectEdges(grayData, width, height) {
    const edgeData = new Uint8Array(width * height);

    // Apply a simple edge detection filter
    // For demonstration purposes, we'll use a Sobel operator
    const sobelX = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
    ];

    const sobelY = [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1]
    ];

    function getPixel(x, y) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
            return grayData[y * width + x];
        }
        return 0;
    }

    function applySobel(x, y) {
        let gx = 0;
        let gy = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const weightX = sobelX[i + 1][j + 1];
                const weightY = sobelY[i + 1][j + 1];
                gx += getPixel(x + j, y + i) * weightX;
                gy += getPixel(x + j, y + i) * weightY;
            }
        }
        return Math.sqrt(gx * gx + gy * gy);
    }

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const edgeStrength = applySobel(x, y);
            edgeData[y * width + x] = edgeStrength > 30 ? 1 : 0; // Threshold value
        }
    }

    return edgeData;
}



// K-means

let defaultK = 4

function applyKMeans() {
    if (!selectedImageId) {
        alert("Please select an image first!");
        return;
    }

    // Get the value of K (number of clusters) from the input
    const kInput = document.getElementById('kInput').valueAsNumber;
    const K = kInput && kInput > 0 ? parseInt(kInput) : defaultK; // Use default if no input or invalid

    // Get the selected image's src
    const selectedImage = document.getElementById(selectedImageId);
    const img = new Image();
    img.src = selectedImage.src;

    img.onload = function() {
        const originalCanvas = document.getElementById('originalCanvasK');
        const ctx = originalCanvas.getContext('2d');



        originalCanvas.width = img.width;
        originalCanvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        processKMeans(imageData, K); // Pass K value
    };
}

// K-means algorithm applied on imageData
function processKMeans(imageData, K) {
    const kmeansCanvas = document.getElementById('kmeansCanvas');
    const ctx = kmeansCanvas.getContext('2d');

    kmeansCanvas.width = imageData.width;
    kmeansCanvas.height = imageData.height;

    // Extract pixel data
    const pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        pixels.push([r, g, b]);
    }

    // Run K-means algorithm
    const clusters = kmeans(pixels, K);

    // Recolor the image based on clusters
    const newImageData = ctx.createImageData(imageData.width, imageData.height);
    for (let i = 0; i < clusters.assignments.length; i++) {
        const [r, g, b] = clusters.centroids[clusters.assignments[i]];
        newImageData.data[i * 4] = r;
        newImageData.data[i * 4 + 1] = g;
        newImageData.data[i * 4 + 2] = b;
        newImageData.data[i * 4 + 3] = 255; // Alpha channel
    }

    ctx.putImageData(newImageData, 0, 0);
}

// K-means algorithm implementation
function kmeans(pixels, k) {
    const centroids = [];
    for (let i = 0; i < k; i++) {
        const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
        centroids.push(randomPixel);
    }

    let assignments = new Array(pixels.length).fill(0);
    let iterations = 0;

    while (true) {
        iterations++;
        let newAssignments = [];
        let moved = false;

        // Assign pixels to nearest centroid
        for (let i = 0; i < pixels.length; i++) {
            let minDistance = Infinity;
            let clusterIndex = 0;

            for (let j = 0; j < centroids.length; j++) {
                const distance = euclideanDistance(pixels[i], centroids[j]);
                if (distance < minDistance) {
                    minDistance = distance;
                    clusterIndex = j;
                }
            }

            newAssignments[i] = clusterIndex;
            if (newAssignments[i] !== assignments[i]) {
                moved = true;
            }
        }

        if (!moved || iterations > 20) break;

        const newCentroids = Array(k).fill(null).map(() => [0, 0, 0]);
        const counts = Array(k).fill(0);

        for (let i = 0; i < pixels.length; i++) {
            const clusterIndex = newAssignments[i];
            newCentroids[clusterIndex][0] += pixels[i][0];
            newCentroids[clusterIndex][1] += pixels[i][1];
            newCentroids[clusterIndex][2] += pixels[i][2];
            counts[clusterIndex]++;
        }

        for (let j = 0; j < k; j++) {
            if (counts[j] > 0) {
                centroids[j] = [
                    Math.floor(newCentroids[j][0] / counts[j]),
                    Math.floor(newCentroids[j][1] / counts[j]),
                    Math.floor(newCentroids[j][2] / counts[j])
                ];
            }
        }

        assignments = newAssignments;
    }

    return { centroids, assignments };
}

// Euclidean distance function
function euclideanDistance(pixel1, pixel2) {
    return Math.sqrt(
        Math.pow(pixel1[0] - pixel2[0], 2) +
        Math.pow(pixel1[1] - pixel2[1], 2) +
        Math.pow(pixel1[2] - pixel2[2], 2)
    );
}