const torrentStream = require('torrent-stream');
const express = require('express');
const mime = require('mime-types');
const archive = archiver('zip');
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
});

app.get('/download', (req, res) => {
  const magnetURI = req.query.magnet;
  if (!magnetURI) {
    return res.status(400).json({ error: 'Magnet URI is required' });
  }
  const engine = torrentStream(magnetURI);
  const videoStreams = [];
  engine.on('ready', () => {
    console.log('Engine ready');
    const videoFiles = engine.files.filter((file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      return ext === 'mp4' || ext === 'mkv' || ext === 'avi';
    });
    if (videoFiles.length === 0) {
      return res.status(404).json({ error: 'No video files found in the torrent' });
    }

    res.attachment('videos.zip');
    res.setHeader('Content-Type', 'application/octet-stream');
    archive.pipe(res);
    videoFiles.forEach((file) => {
      const readStream = file.createReadStream();
      videoStreams.push(readStream);
      archive.append(readStream, { name: file.name });
    });
    archive.finalize();
  });
  engine.on('download', () => {
    if (engine.swarm.downloaded === engine.swarm.numPeers * engine.torrent.length) {
      console.log('Download complete');
      videoStreams.forEach((stream) => {
        stream.destroy();
      });
    }
  });
  engine.on('error', (err) => {
    console.error('Error initializing torrent engine:', err);
    res.status(500).send('Error initializing torrent engine');
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
