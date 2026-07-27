# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Node.js HTTP server application for downloading and converting video streams. It supports:
- Downloading M3U8 playlists and their TS segments
- Converting downloaded segments to MP4 format using FFmpeg
- Streaming RTSP feeds to HLS format
- Serving a web interface for browsing and playing downloaded videos

## Running the Application

```bash
node app.js
```

The server runs on port 3000 by default.

## Core Architecture

### Main Entry Point: app.js

The HTTP server handles several routes:
- `/` - Lists all downloaded videos from the `./media` directory
- `/video/*` - Video player page using Video.js library
- `/getvideo` - Initiates M3U8 to MP4 download (via `getVideo.js`)
- `/get-ts` - Downloads M3U8 playlist as individual TS segments (via `get-ts.js`)
- `/media/*` - Serves static media files
- `/views/download` - HTML form interface for downloading videos

### Video Download Modules

**get-ts.js** - Downloads M3U8 playlists and individual segments:
- Fetches the M3U8 manifest file
- Parses and rewrites URLs in the manifest to local paths
- Downloads each TS/JPG/JPEG segment sequentially
- Stores segments in `./media/{videoname}/` directory
- Creates a rewritten `index.m3u8` that points to local segments
- Handles both HTTP and HTTPS protocols
- Skips already downloaded segments
- Retries on network errors

**getVideo.js** - Downloads and converts M3U8 to MP4:
- Downloads TS segments to `./media-ts/` directory
- Concatenates segments into a single TS file
- Uses FFmpeg to convert the concatenated TS file to MP4
- Stores final MP4 in `./media/` directory
- Command: `ffmpeg -i ./media-ts/{filename}.ts ./media/{filename}.mp4`

**to-mp4.js** - Manual utility for converting existing TS files:
- Reads TS files from `./media/{name}/` directory
- Concatenates them into `./mp4/{name}.ts`
- Converts to MP4 with decryption key support
- Currently hardcoded to process 'shenzhen' directory
- Not integrated into the web server (standalone script)

### RTSP Streaming: getRtsp1.js

Standalone RTSP to HLS converter (runs on port 8081):
- Uses FFmpeg to convert RTSP stream to HLS segments
- Stores HLS files in `./hls/` directory
- Serves an HTML page with HLS.js player
- FFmpeg args: `-rtsp_transport tcp -c:v copy -hls_time 2 -hls_list_size 5 -hls_flags delete_segments`

### Frontend

**index.html** - Lists all available videos in `./media` directory with links to play them

**video.html** - Video player using Video.js library to play HLS streams

**views/download.js** - Generates an HTML form interface for calling the `/get-ts` API endpoint with URL and name parameters

## Important Implementation Details

### URL Handling in get-ts.js

The M3U8 parser handles different URL formats:
- Absolute URLs (with http/https protocol) are used as-is
- Relative URLs without "/" are joined with the base directory path
- Relative URLs with "/" are joined with just the hostname
- Query parameters are stripped when saving local files

### Media Storage Structure

```
./media/
  ├── {videoname}/
  │   ├── index.m3u8 (rewritten manifest)
  │   ├── segment0.ts
  │   ├── segment1.ts
  │   └── ...
./media-ts/
  └── {filename}.ts (concatenated file for conversion)
./hls/
  ├── stream.m3u8
  └── stream*.ts (RTSP HLS segments)
```

Note: `./media` is a symlink to `/mnt/nas/media`

### FFmpeg Usage

This application requires FFmpeg to be installed and available in PATH for:
- Converting TS to MP4 format
- Converting RTSP streams to HLS format

### Dependencies

- `ws` - WebSocket library (installed but not actively used in current code)
- `node-rtsp-stream` - RTSP streaming (installed but not actively used in current code)

The application primarily uses built-in Node.js modules (http, https, fs, path, child_process).

### Protocol Handling

The download modules (`get-ts.js`, `getVideo.js`) dynamically select http or https module based on URL protocol. For HTTPS, TLS certificate validation is disabled via `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'`.
