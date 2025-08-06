import qrcode
import sys

# Usage: python generate_qrs.py <lat> <lon> <base_url>
# Example: python generate_qrs.py 36.9916 -122.0608 https://slugstop.ucsc.edu/track

def generate_qr(lat, lon, base_url):
    url = f"{base_url}?lat={lat}&lon={lon}"
    img = qrcode.make(url)
    img.save(f"qr_{lat}_{lon}.png")
    print(f"QR code generated for {url}")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python generate_qrs.py <lat> <lon> <base_url>")
        sys.exit(1)
    lat = sys.argv[1]
    lon = sys.argv[2]
    base_url = sys.argv[3]
    generate_qr(lat, lon, base_url)
