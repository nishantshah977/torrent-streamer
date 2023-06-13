const torrentStream = require('torrent-stream');
const express = require('express');
const mime = require('mime-types');
const archiver = require('archiver');
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


app.get('/info/:magnetURI', (req, res) => {
  const magnetURI = req.params.magnetURI;
  if (!magnetURI || magnetURI == "" || magnetURI == " ") {
    return res.status(400).json({ error: 'Magnet URI is required' });
  }
  const engine = torrentStream(magnetURI);
  engine.on('ready', () => {
  const torrent = engine.torrent;
   
   const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <script async="async" data-cfasync="false" src="//pl19715772.highrevenuegate.com/72cca2607972566db507616fa7493279/invoke.js"></script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width">
    <title>Download Torrent</title>
    <style>
        .loader {
  border: 16px solid #f3f3f3; /* Light grey */
  border-top: 16px solid #3498db; /* Blue */
  border-radius: 50%;
  width: 120px;
  height: 120px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.info{
    width:90%;
    background:rgb(0,0,0,0.2);
    border-radius:10px;
    margin-top:40px;
}
    </style>
</head>
<body>
    <a href="/download/${magnetURI}" id="a"></a>
    <script>
        document.getElementById('a').click();
    </script>
    <center>
        <h1 style="padding-top:20px;">Download will start Shortly...</h1>
        <div class="loader"></div>
        
        <div class="info">
            <h1 style="padding-top:10px;">Torrent Information</h1>
            <ul style="padding-bottom:10px;">
                <li><b>Name: </b> ${torrent.name}</li>
                <li><b>Size: </b> ${torrent.files.length}</li>
                <li><b>Peers: </b> ${torrent.numPeers}</li>
            </ul>
        </div>
<div id="container-72cca2607972566db507616fa7493279"></div>
    </center>
    <script type='text/javascript' src='//pl19715794.highrevenuegate.com/56/d4/40/56d44000a44117d52cc02e05e9342155.js'></script>
</body>
</html>
`;
res.send(html);
});
});



app.get('/download/:magnetURI', (req, res) => {
  const magnetURI = req.query.magnetURI;
  if (!magnetURI || magnetURI == "" || magnetURI == " ") {
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
    const archive = archiver('zip');
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
