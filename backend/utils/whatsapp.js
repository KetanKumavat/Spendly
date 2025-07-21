const axios = require("axios");

async function getMediaUrl(mediaId, token) {
    const res = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data.url;
}

async function downloadMediaBuffer(mediaUrl, token) {
    const res = await axios.get(mediaUrl, {
        responseType: "arraybuffer",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data; // Buffer
}

module.exports = { getMediaUrl, downloadMediaBuffer };
