var https = require("https");
var http = require("http");
var fs = require("fs");
var path = require("path");
var url = require("url");


var getTsMap = function (res, mapUrl, videoname) {
  var myurl = url.parse(mapUrl);
  var hostdir = path.parse(myurl.pathname).dir // /20230919/21729_c23ad792/2000k/hls/mixed.m3u8
  console.log(hostdir);
  var hostName = `${myurl.protocol}//${myurl.hostname}`

  var dirPath = path.join(__dirname,'media',videoname)
  if(!fs.existsSync(dirPath)){
    fs.mkdirSync(dirPath)
  }
  var protocol = null
  if(mapUrl.indexOf('https')>-1){
    protocol = https
  } else {
    protocol = http
  }
  protocol.get(mapUrl, function (result) {
    var tsFile = path.join(dirPath,'index.m3u8')
    fs.writeFileSync(tsFile,'')
    var data = Buffer.alloc(0);
    result.on("data", function (chunk) {
      data = Buffer.concat([data, chunk]);
    });
    result.on("end", function () {
      var content = data.toString();

      if (content.indexOf('html') > -1) {
        res.end('error')
        return
      }
      var contentArr = content.split("\n");
      var bufferArr = []
      if (contentArr.length > 0) {
        for (var i = 0; i < contentArr.length; i++) {
          var ele = contentArr[i];
          console.log(ele);
          if (ele.indexOf(".ts") > -1) {
            if (ele.indexOf("http") > -1) {
              bufferArr.push(ele)
            } else {
              ele = path.join(hostName,hostdir, '/', ele)
              bufferArr.push(ele)
            }
            console.log(ele);
            var urlObj = new URL(ele)
            ele = urlObj.pathname
            var pathObj = path.parse(ele)
            ele = path.join('/media',videoname, pathObj.base)
          }
          fs.appendFileSync(tsFile, ele+'\n');
        }
       
        res.end('downloading……')

        getVideoBuffer(dirPath,bufferArr,0)
      } else {
        res.end('error')
      }
    });
  });
};

function getVideoBuffer(dirPath, contentArr, i) {
  if (i < contentArr.length) {
    var ele = contentArr[i];
    var j = i + 1
    console.log(`${j}/${contentArr.length}`, 'get', ele);
    var pathObj = path.parse(ele)
    if(fs.existsSync(path.join(dirPath,pathObj.base))){
      getVideoBuffer(dirPath, contentArr, j)
      return
    }
    var protocol = null
    if(ele.indexOf('https')>-1){
      protocol = https
    } else {
      protocol = http
    }
    protocol.get(ele, function (res) {
      var data = Buffer.alloc(0);
      res.on("data", function (chunk) {
        data = Buffer.concat([data, chunk]);
      });
      res.on("end", function () {
        
        fs.writeFile(path.join(dirPath,pathObj.base), data,()=>{});
        getVideoBuffer(dirPath, contentArr, j)
      });
    });
  } else {
    console.log('download done');
    return
  }
}

module.exports = function (req, res) {
  var url = decodeURIComponent(req.query.url)
  var videoName = encodeURIComponent(req.query.name)
  getTsMap(res, url, videoName);
}
