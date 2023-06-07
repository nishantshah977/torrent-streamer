const express = require('express');

const torrentStream = require('torrent-stream');

const archiver = require('archiver');

const app = express();

// Endpoint for downloading torrents

app.get('/download', (req, res) => {

  const magnetURI = req.query.magnet;

  if (!magnetURI) {

    return res.status(400).json({ error: 'Magnet URI is required' });

  }

  // Create a torrent engine

  const engine = torrentStream(magnetURI);

  // Array to store file streams

  const videoStreams = [];

  // When the engine is ready

  engine.on('ready', () => {

    console.log('Engine ready');

    // Filter video files based on file extension

    const videoFiles = engine.files.filter((file) => {

      const ext = file.name.split('.').pop().toLowerCase();

      return ext === 'mp4' || ext === 'mkv' || ext === 'avi'; // Add more extensions if needed

    });

    if (videoFiles.length === 0) {

      return res.status(404).json({ error: 'No video files found in the torrent' });

    }

    // Create a zip archive

    const archive = archiver('zip');

    // Set the appropriate headers for the zip archive

    res.attachment('videos.zip');

    res.setHeader('Content-Type', 'application/octet-stream');

    // Pipe the zip archive to the client's response

    archive.pipe(res);

    // Iterate over video files

    videoFiles.forEach((file) => {

      // Create a read stream for the video file

      const readStream = file.createReadStream();

      // Add the video stream to the array

      videoStreams.push(readStream);

      // Add the video file to the zip archive

      archive.append(readStream, { name: file.name });

    });

    // Finalize the zip archive

    archive.finalize();

  });

  // When the download is complete

  engine.on('download', () => {

    if (engine.swarm.downloaded === engine.swarm.numPeers * engine.torrent.length) {

      console.log('Download complete');

      // Cleanup: Close all video streams

      videoStreams.forEach((stream) => {

        stream.destroy();

      });

    }

  });

});

// Start the server

app.listen(3000, () => {

  console.log('Server started on port 3000');

});