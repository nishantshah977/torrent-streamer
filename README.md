# torrent-streamer
Stream Torrent online without installing torrent client on your device.
# Package 
``` 
npm init -y
npm i torrent-stream express range-parser 
``` 
# EndPoint 
``` 
http://localhost:3000/stream/[InfoHash]/[fileIndex] 
```
**BreakDown** 
InfoHash - Hash of the file
fileIndex - File Nummber you want to stream 

# Example Use 
``` 
http://localhost:3000/stream/D5FCCCC350BB1F09A354E76C2BD6D775C5E660A2/0
```
