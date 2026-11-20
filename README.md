# LiteGet 240p — Opera Mini 4.4 Web Frontend

A minimal, under-10KB static web interface designed for **Opera Mini 4.4** and 3-inch feature phone displays (240×320, e.g., Itel Neo R60+).

## Why a Separate Backend Is Required
**GitHub Pages only serves static files (HTML, CSS, JS).** It cannot execute server-side code, bypass Cross-Origin Resource Sharing (CORS) restrictions, or run stream extraction tools (`yt-dlp`, `ffmpeg`, etc.). 

Additionally, Opera Mini 4.4 routes all traffic through Opera's cloud transcoding servers and enforces strict timeouts on client-side JavaScript. Therefore, this frontend acts solely as a lightweight remote control that sends a URL and quality preference (`240p`) to a separate backend service that you control.

## Setup & Deployment

1. **Host the Frontend:** Push `index.html`, `style.css`, and `app.js` to a GitHub repository and enable **GitHub Pages**.
2. **Configure the API Endpoint:**
   - Edit `DEFAULT_API_BASE` at the top of `app.js`, **or**
   - Tap **API Settings** in the footer on your phone to save your endpoint URL in a browser cookie.

## Expected Backend API Contract

Your self-hosted backend (e.g., a lightweight Python Flask/FastAPI or Node.js Express server) should accept a `GET` request with `url` and `quality` query parameters:

```http
GET /api/extract?url=https%3A%2F%2Fexample.com%2Fwatch%3Fv%3D123&quality=240p