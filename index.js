const torrentStream = require('torrent-stream');

const express = require('express');

const mime = require('mime-types');

const app = express();

const port = 3000;

app.get('/stream', (req, res) => {

  const magnetLink = req.query.magnet;

  if (!magnetLink) {

    return res.status(400).send('No magnet link provided');

  }

  const engine = torrentStream(magnetLink);

  let activeFileIndex = 0;

  engine.on('ready', () => {

    const videoFiles = engine.files.filter(file => {

      const mimeType = mime.lookup(file.name);

      return mimeType && mimeType.startsWith('video/');

    });

    if (videoFiles.length === 0) {

      engine.destroy();

      return res.status(404).send('No video files found in the torrent');

    }

    res.setHeader('Content-Type', 'video/mp4');

    const file = videoFiles[activeFileIndex];

    const stream = file.createReadStream();

    stream.on('error', (err) => {

      console.error('Error streaming file:', err);

      engine.destroy();

    });

    stream.on('end', () => {

      activeFileIndex++;

      if (activeFileIndex < videoFiles.length) {

        const nextFile = videoFiles[activeFileIndex];

        nextFile.select();

        nextFile.createReadStream().pipe(res);

      } else {

        engine.destroy();

        res.end();

      }

    });

    stream.pipe(res);

  });

  engine.on('error', (err) => {

    console.error('Error initializing torrent engine:', err);

    res.status(500).send('Error initializing torrent engine');

  });

});

app.listen(port, () => {

  console.log(`Server is running on port ${port}`);

});

        
