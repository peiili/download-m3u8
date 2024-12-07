## start

```
node app.js
```

## home videos list
```
http://192.168.1.7:3000/
```


## download video to mp4
```
http://192.168.1.7:3000/getvideo?url=https%3A%2F%2Fs1.1080pzy.co%2F20220620%2FCggWAvp5%2Fhls%2Findex.m3u8&name=茶啊二中
```
## download m3u8 to ts
```
http://192.168.1.7:3000/get-ts?url=https%3A%2F%2Fs1.1080pzy.co%2F20220620%2FCggWAvp5%2Fhls%2Findex.m3u8&name=茶啊二中

```

必要时根据`m3u8`的内容调整`getVideos`的请求`ts`文件的地址，

https://cdn77-vid.xvideos-cdn.com/gMKaiwkfIOkFRGPYm_QSvQ==,1725993619/videos/hls/d8/4d/c5/d84dc599600540232f79babe553c3eed/hls.m3u8

http://192.168.1.7:3000/get-ts?url=https%3A%2F%2Fs1.1080pzy.co%2F20220620%2FCggWAvp5%2Fhls%2Findex.m3u8&name=茶啊二中