const torrentStream = require('torrent-stream');

const fs = require('fs');

const express = require('express');

const rangeParser = require('range-parser');

const app = express();

app.get('/stream/:infoHash/:fileIndex', (req, res) => {

  const { infoHash, fileIndex } = req.params;

  // Create a torrent stream instance

  const engine = torrentStream(`magnet:?xt=urn:btih:${infoHash}`);

  engine.on('ready', () => {

    const file = engine.files[parseInt(fileIndex, 10)];

    // Set response headers for streaming

    res.setHeader('Content-Length', file.length);

    res.setHeader('Content-Type', 'video/mp4');

    res.setHeader('Accept-Ranges', 'bytes');

    // Handle range requests

    if (req.headers.range) {

      const ranges = rangeParser(file.length, req.headers.range);

      if (ranges === -1 || ranges === -2 || ranges.length !== 1) {

        res.status(416).end();

        return;

      }

      const { start, end } = ranges[0];

      res.statusCode = 206;

      res.setHeader('Content-Range', `bytes ${start}-${end}/${file.length}`);

      res.setHeader('Content-Length', end - start + 1);

      file.createReadStream({ start, end }).pipe(res);

    } else {

      // Stream the entire file

      file.createReadStream().pipe(res);

    }

  });

  engine.on('error', (err) => {

    console.error('Torrent error:', err.message);

    res.status(500).send('Internal Server Error');

  });

});

app.listen(3000, () => {

  console.log('Torrent streamer is running on port 3000');

});

    
