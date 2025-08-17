Walk Safe - Safety Companion App is a MERN stack-based application designed to enhance personal safety and community awareness. It empowers users to create and share posts about unsafe locations, report incidents in real-time, and stay updated with the latest safety news. With authentication and authorization using JWT, users can securely log in, like/unlike posts, and add comments. The app features live location sharing with trusted contacts and a 24/7 chatbot for immediate assistance. By combining safety alerts, community-driven posts, and real-time communication, Walk Safe serves as a reliable companion to promote awareness, prevent risks, and ensure safer environments.
## Feature List

- 🌟 **Tech Stack**: MERN (MongoDB, Express, React, Node.js) + Material UI
- 🔐 **Authentication & Authorization** with JWT
- 📝 **Create Posts** about unsafe locations
- 🗑️ **Delete Posts** you've created
- ❤️ **Like/Unlike** safety posts
- 📍 **Share Live Location** with trusted contacts
- 🚨 **Report Incidents** in real-time
- 📰 **Get Latest Safety News**
- 🤖 **24/7 Chatbot** for immediate help
- 💬 **Comment** on safety posts

## Environment Setup

Create a `.env` file with these variables:

```env
PORT=5000
NEWS_API_KEY=your_newsapi_key
CLOUDNAME=your_cloudinary_name
APIKEY=your_cloudinary_key
APISECRET=your_cloudinary_secret
KEY=your_jwt_secret
CONNECTION_URL=mongodb://localhost:27017/walksafe
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

```shell
git clone https://github.com/yourusername/walk-safe.git
cd walk-safe

```

### run the client

```shell
cd client
npm install or npm install --legacy-peer-deps
npm start
```

### run the server

```shell
cd server
npm install 
npm start
```
### Deploy Link
(https://walk-safe.netlify.app/posts)
