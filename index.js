const torrentStream = require('torrent-stream');
const fs = require('fs');
const express = require('express');
const rangeParser = require('range-parser');
const compression = require('compression');

const app = express();
app.use(compression());

app.get('/stream/:infoHash/:fileIndex', async (req, res) => {
  const { infoHash, fileIndex } = req.params;
  // Create a torrent stream instance
  const engine = await torrentStream(`magnet:?xt=urn:btih:${infoHash}`);

  engine.on('ready', async () => {
    const file = await engine.files[parseInt(fileIndex, 10)];

    // Set response headers for streaming
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');

    const rangeHeader = req.headers.range;
    if (rangeHeader) {
      const ranges = rangeParser(file.length, rangeHeader);

      if (ranges === -1 || ranges === -2 || ranges.length !== 1) {
        res.status(416).end();
        return;
      }

      const { start, end } = ranges[0];
      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${file.length}`);
      res.setHeader('Content-Length', end - start + 1);
      res.flush(); // Send the response headers immediately

      file.createReadStream({ start, end }).pipe(res);
    } else {
      res.setHeader('Content-Length', file.length);
      res.flush(); // Send the response headers immediately

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
