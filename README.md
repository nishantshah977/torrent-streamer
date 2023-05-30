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
http://localhost:3000/stream/052AA1CC5D12A1D30CBA7051F6CC873E68E4332A/0
```
