var https = require("https");
var http = require("http");
var fs = require("fs");
var path = require("path");
var url = require("url");

function getRequestOptions(targetUrl) {
  var parsedUrl = url.parse(targetUrl);
  return {
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.path,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive'
    }
  };
}

function makeAbsoluteUrl(ele, baseUrl, hostdir) {
  if (ele.indexOf('http://') === 0 || ele.indexOf('https://') === 0) {
    return ele;
  }
  if (ele.indexOf('//') === 0) {
    return `${baseUrl.protocol}${ele}`;
  }
  if (ele.indexOf('/') === 0) {
    return `${baseUrl.origin}${ele}`;
  }
  return `${baseUrl.origin}${hostdir}/${ele}`;
}

let total = 0
let progress = 0
var getTsMap = function (res, mapUrl, prefix, videoname) {
  var mapUrlObj = new URL(mapUrl);
  var hostdir = path.posix.dirname(mapUrlObj.pathname);
  console.log('11:', hostdir);
  var hostName = mapUrlObj.origin;

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
  console.log(mapUrl);
  console.log(protocol);
  
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 
// 然后继续你的代码
  const request = protocol.get(getRequestOptions(mapUrl), function (result) {
    if (result.statusCode !== 200) {
      console.log('[err]', mapUrl);
      
      return
    }
    var data = Buffer.alloc(0);
    result.on("data", function (chunk) {
      data = Buffer.concat([data, chunk]);
    });
    result.on("end", function () {
      var content = data.toString();
      var tsFile = path.join(dirPath,'index.m3u8')
      if(fs.existsSync(tsFile)){
        content = fs.readFileSync(tsFile, 'utf-8')
      } else {
        fs.writeFileSync(tsFile,'')
      }
      console.log(content);
      
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
          if (ele.indexOf(".ts") > -1 || ele.indexOf(".jpg") > -1 ||ele.indexOf(".jpeg") > -1) {
            var absUrl = makeAbsoluteUrl(ele.trim(), mapUrlObj, hostdir);
            bufferArr.push(absUrl);
            console.log(absUrl);
            var urlObj = new URL(absUrl);
            ele = urlObj.pathname;
            var pathObj = path.parse(ele);
            ele = path.join('/media', videoname, pathObj.base);
          }
          fs.appendFileSync(tsFile, ele+'\n');
        }
       
        res.end('downloading……')
        total = bufferArr.length
        getVideoBuffer(dirPath,bufferArr,0)
      } else {
        res.end('error')
      }
    });
  });
  request.on('error', function(err){
    console.error(err);
    
  })
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
    protocol.get(getRequestOptions(ele), function (res) {
        
      if(res.statusCode===404 ) {
        console.error('%c 404','background: yellow; color: red' ,ele);
        
          getVideoBuffer(dirPath, contentArr, j)
          return
      }

      var data = Buffer.alloc(0);
      res.on("data", function (chunk) {
        data = Buffer.concat([data, chunk]);
      });
      res.on("end", function () {
        fs.writeFile(path.join(dirPath,pathObj.base.split('?')[0]), data,()=>{});
        getVideoBuffer(dirPath, contentArr, j)
      });

    }).on('error', function(err){
	    console.log('网络错误，重试')
	    
        getVideoBuffer(dirPath, contentArr, i)
      console.error(err);
    });
  } else {
    console.log('download done');
    return
  }
}

module.exports = function (req, res) {
  var url = decodeURIComponent(req.query.url)
  var videoName = encodeURIComponent(req.query.name)  
  var prefix = encodeURIComponent(req.query.prefix)  // 下载文件时的前缀

// https://yzzy.play-cdn13.com/20230329/21353_5a44c0f9/2000k/hls/
  getTsMap(res, url, prefix, videoName);
}
