# MongoDB Setup Guide for SlugStop

## Option 1: MongoDB Atlas (Recommended) ☁️

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/atlas
2. Sign up for a free account
3. Create a new project called "SlugStop"

### Step 2: Create a Cluster
1. Choose "Build a Database" 
2. Select **M0 FREE** tier
3. Choose a region close to you
4. Name your cluster "slugstop-cluster"

### Step 3: Set Up Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `slugstop-admin`
5. Generate a secure password (save this!)
6. Add user with "Atlas admin" privileges

### Step 4: Set Up Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
4. Or add your specific IP address for security

### Step 5: Get Connection String
1. Go to "Clusters" and click "Connect"
2. Choose "Connect your application"
3. Select "Node.js" and version "4.1 or later"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `myFirstDatabase` with `slugstop`

Example connection string:
```
mongodb+srv://slugstop-admin:<password>@slugstop-cluster.xxxxx.mongodb.net/slugstop?retryWrites=true&w=majority
```

### Step 6: Update Your .env File
Replace your MONGODB_URI in `.env` with:
```
MONGODB_URI=mongodb+srv://slugstop-admin:YOUR_PASSWORD@slugstop-cluster.xxxxx.mongodb.net/slugstop?retryWrites=true&w=majority
```

---

## Option 2: Local MongoDB Installation 🏠

### For Windows:
1. Download from: https://www.mongodb.com/try/download/community
2. Run the installer
3. Choose "Complete" installation
4. Install as Windows Service
5. Install MongoDB Compass (GUI tool)

### For macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### For Linux (Ubuntu):
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

---

## Testing Your Connection

1. Open `slugstop-db-test.mongodb.js`
2. Make sure VS Code MongoDB extension is connected
3. Run the playground to test your database

## Setting Up Your Database

After connecting, run these commands:

```bash
# Install dependencies
npm install

# Set up admin user
node scripts/setupAdmin.js

# Seed METRO routes
node scripts/seedMetroRoutes.js
```

## For Vercel Deployment

MongoDB Atlas is required for Vercel deployment. Local MongoDB won't work with serverless functions.

---

## Troubleshooting

### Connection Issues:
- Check your IP is whitelisted in Atlas
- Verify username/password are correct
- Ensure connection string has the right cluster name

### VS Code MongoDB Extension:
1. Install "MongoDB for VS Code" extension
2. Click MongoDB icon in sidebar
3. Add connection using your connection string
4. Select your database to run playground files
