const vision = require("@google-cloud/vision");
const path = require("path");

// console.log(__dirname);

const client = new vision.ImageAnnotatorClient({
    keyFilename: path.join(__dirname, "../config/google-credentials.json"),
});

async function extractTextFromImage(imageUrl) {
    const [result] = await client.textDetection(imageUrl);
    const detections = result.textAnnotations;
    if (detections.length > 0) {
        return detections[0].description;
    }
    return "";
}

module.exports = { extractTextFromImage };
