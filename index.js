const torrentStream = require('torrent-stream');
const fs = require('fs');
const express = require('express');
const rangeParser = require('range-parser');
const compression = require('compression');

const app = express();
app.use(compression());

const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB

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
      const totalSize = end - start + 1;

      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${file.length}`);
      res.setHeader('Content-Length', totalSize);

      // Stream each chunk separately
      let chunkStart = start;
      let chunkEnd = Math.min(chunkStart + CHUNK_SIZE - 1, end);

      while (chunkStart <= end) {
        res.writeHeader(200, {
          'Content-Range': `bytes ${chunkStart}-${chunkEnd}/${file.length}`,
          'Content-Length': chunkEnd - chunkStart + 1,
          'Content-Type': 'video/mp4',
        });

        const chunkStream = file.createReadStream({ start: chunkStart, end: chunkEnd });
        chunkStream.pipe(res);

        // Update chunkStart and chunkEnd for the next chunk
        chunkStart = chunkEnd + 1;
        chunkEnd = Math.min(chunkStart + CHUNK_SIZE - 1, end);
      }

      res.end();
    } else {
      res.setHeader('Content-Length', file.length);
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
