// script.js

const analyzeButton = document.getElementById("analyzeButton");
const imageInput = document.getElementById("imageInput");
const resultsDiv = document.getElementById("results");
const tumorTypeDiv = document.getElementById("tumorType");
const tumorConfidenceDiv = document.getElementById("tumorConfidence");
const tumorAreaDiv = document.getElementById("tumorArea");
const imageCanvas = document.getElementById("imageCanvas");
const ctx = imageCanvas.getContext("2d");

// Backend API URLs (replace <ngrok-url> with your actual ngrok URL)
const tumorTypeAPI = "https://a05c-34-16-231-9.ngrok-free.app//predict/tumor-type/";
const segmentationAPI = "https://a05c-34-16-231-9.ngrok-free.app//predict/segmentation/";

// Event listener for the "Analyze Image" button
analyzeButton.addEventListener("click", async () => {
    const file = imageInput.files[0];
    if (!file) {
        alert("Please upload an image file.");
        return;
    }

    // Show the results section
    resultsDiv.style.display = "none";

    const formData = new FormData();
    formData.append("file", file);

    try {
        // Step 1: Predict Tumor Type
        const tumorTypeResponse = await fetch(tumorTypeAPI, {
            method: "POST",
            body: formData,
        });
        const tumorTypeData = await tumorTypeResponse.json();

        // Display Tumor Type and Confidence
        tumorTypeDiv.textContent = `Tumor Type: ${tumorTypeData["Tumor Type"]}`;
        tumorConfidenceDiv.textContent = `Confidence: ${(tumorTypeData["Confidence"] * 100).toFixed(2)}%`;

        // If no tumor is detected, stop here
        if (tumorTypeData["Tumor Type"] === "No Tumor") {
            tumorAreaDiv.textContent = "No tumor detected.";
            resultsDiv.style.display = "block";
            return;
        }

        // Step 2: Predict Segmentation
        const segmentationResponse = await fetch(segmentationAPI, {
            method: "POST",
            body: formData,
        });
        const segmentationData = await segmentationResponse.json();

        // Display Tumor Area
        tumorAreaDiv.textContent = `Tumor Area: ${segmentationData["Tumor Area (pixels)"]} pixels`;

        // Draw the uploaded image on the canvas
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = () => {
                imageCanvas.width = img.width;
                imageCanvas.height = img.height;
                ctx.drawImage(img, 0, 0, img.width, img.height);

                // Overlay the segmentation mask
                const binaryMask = segmentationData["Binary Mask"];
                const maskImageData = ctx.createImageData(img.width, img.height);
                for (let i = 0; i < binaryMask.length; i++) {
                    const value = binaryMask[i] * 255; // Scale mask to grayscale (0-255)
                    maskImageData.data[i * 4] = value; // Red
                    maskImageData.data[i * 4 + 1] = 0; // Green
                    maskImageData.data[i * 4 + 2] = 0; // Blue
                    maskImageData.data[i * 4 + 3] = 100; // Alpha
                }
                ctx.putImageData(maskImageData, 0, 0);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while processing the image.");
    }

    // Show the results section
    resultsDiv.style.display = "block";
});
