const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Usage: node generate_qrs.js <lat> <lon> <base_url>
// Example: node generate_qrs.js 36.9916 -122.0608 https://slugstop.ucsc.edu/track

async function generateQR(lat, lon, baseUrl) {
    try {
        const url = `${baseUrl}?lat=${lat}&lon=${lon}`;
        const fileName = `qr_${lat}_${lon}.png`;
        const filePath = path.join(__dirname, fileName);
        
        await QRCode.toFile(filePath, url, {
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 256
        });
        
        console.log(`QR code generated for ${url}`);
        console.log(`Saved as: ${fileName}`);
    } catch (error) {
        console.error('Error generating QR code:', error);
        process.exit(1);
    }
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length !== 3) {
        console.log('Usage: node generate_qrs.js <lat> <lon> <base_url>');
        console.log('Example: node generate_qrs.js 36.9916 -122.0608 http://localhost:3000/track');
        process.exit(1);
    }
    
    const [lat, lon, baseUrl] = args;
    generateQR(lat, lon, baseUrl);
}

module.exports = { generateQR };
