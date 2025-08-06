const mongoose = require('mongoose');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Stop = require('./models/Stop');

async function generateQRCodes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');
        
        // Create QR codes directory if it doesn't exist
        const qrDir = path.join(__dirname, 'qrcodes', 'generated');
        if (!fs.existsSync(qrDir)) {
            fs.mkdirSync(qrDir, { recursive: true });
        }
        
        // Get all stops
        const stops = await Stop.find({ isActive: true });
        console.log(`Found ${stops.length} active bus stops`);
        
        const baseURL = process.env.BASE_URL || 'http://localhost:3001';
        
        for (const stop of stops) {
            try {
                // Generate QR code URL that points to the stop tracking page
                const qrURL = `${baseURL}/track?stop=${encodeURIComponent(stop.name)}`;
                
                // Generate QR code as PNG
                const qrCodePath = path.join(qrDir, `${stop.name.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`);
                
                await QRCode.toFile(qrCodePath, qrURL, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                
                console.log(`✅ Generated QR code for ${stop.name}`);
                console.log(`   📄 File: ${qrCodePath}`);
                console.log(`   🔗 URL: ${qrURL}`);
                
            } catch (error) {
                console.error(`❌ Error generating QR for ${stop.name}:`, error.message);
            }
        }
        
        // Generate HTML file with all QR codes for printing
        await generatePrintableQRSheet(stops, qrDir, baseURL);
        
        console.log(`\n✅ QR code generation complete!`);
        console.log(`📁 QR codes saved to: ${qrDir}`);
        console.log(`🖨️  Print sheet available at: ${path.join(qrDir, 'print_all_qr_codes.html')}`);
        
    } catch (error) {
        console.error('❌ Error generating QR codes:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

async function generatePrintableQRSheet(stops, qrDir, baseURL) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UCSC SlugStop QR Codes - Print Sheet</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            print-color-adjust: exact;
        }
        .qr-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
            margin: 20px 0;
        }
        .qr-item {
            border: 2px solid #003c6c;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            page-break-inside: avoid;
            background: #f8f9fa;
        }
        .qr-code {
            margin: 15px auto;
            border: 1px solid #ddd;
        }
        .stop-name {
            font-size: 18px;
            font-weight: bold;
            color: #003c6c;
            margin-bottom: 10px;
        }
        .stop-description {
            font-size: 14px;
            color: #666;
            margin-bottom: 15px;
        }
        .instructions {
            font-size: 12px;
            color: #333;
            margin-top: 10px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            color: #003c6c;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        @media print {
            .qr-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            .qr-item {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🚌 UCSC SlugStop</div>
        <h2>Bus Stop QR Codes</h2>
        <p>Scan QR codes to track buses in real-time</p>
    </div>
    
    <div class="qr-grid">
        ${stops.map(stop => {
            const qrFileName = `${stop.name.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`;
            const qrURL = `${baseURL}/track?stop=${encodeURIComponent(stop.name)}`;
            
            return `
            <div class="qr-item">
                <div class="stop-name">${stop.name}</div>
                <div class="stop-description">${stop.description}</div>
                <img src="./${qrFileName}" alt="QR Code for ${stop.name}" class="qr-code" width="200" height="200">
                <div class="instructions">
                    <strong>Scan to track buses</strong><br>
                    Or visit: ${baseURL}/track<br>
                    Stop ID: ${stop.name}
                </div>
            </div>
            `;
        }).join('')}
    </div>
    
    <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
        <p>Generated on ${new Date().toLocaleDateString()} | UCSC SlugStop Bus Tracking System</p>
        <p>Post these QR codes at the corresponding bus stop locations</p>
    </div>
</body>
</html>
    `;
    
    const htmlPath = path.join(qrDir, 'print_all_qr_codes.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`✅ Generated printable QR sheet: ${htmlPath}`);
}

// Handle command line execution
if (require.main === module) {
    generateQRCodes().catch(error => {
        console.error('❌ QR generation failed:', error.message);
        process.exit(1);
    });
}

module.exports = { generateQRCodes };
