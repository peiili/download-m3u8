const http = require("https");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
let hostName = "";
let filename = "";
let mapUrl = ''
const getTsMap = function (res,req,i) {
  let pathStr = mapUrl.split("/");
  filename = pathStr.pop();

  hostName = pathStr.join("/");
  http.get(mapUrl, function (res) {
    let data = Buffer.alloc(0);
    res.on("data", function (chunk) {
      data = Buffer.concat([data, chunk]);
    });
    res.on("end", function () {
      const content = data.toString();
      console.log(content);

      if(content.indexOf('html')>-1){
        req.end('error')
        return
      }
      const contentArr = content.split("\n");
      console.log(contentArr);
      var bufferArr = []
      if(contentArr.length>0){
        for (let i = 0; i < contentArr.length; i++) {
          const ele = contentArr[i];
          if (ele.indexOf(".ts") > -1) {
              bufferArr.push(ele)
            } else {
            }
        }
        fs.writeFileSync('./media-ts/'+filename+".ts", '');
        req.end('downloading……')
        getVideoBuffer(bufferArr,i)
      } else {
        req.end('error')
      }
    });
  });
};

function getVideoBuffer(contentArr,i) {
    if(i<contentArr.length){
        const ele = contentArr[i];
        var j = i+1
        console.log(`${j}/${contentArr.length}`,'get',ele);
        http.get(ele, function (res) {
            let data = Buffer.alloc(0);
            res.on("data", function (chunk) {
              data = Buffer.concat([data, chunk]);
            });
            res.on("end", function () {
              fs.appendFileSync('./media-ts/'+filename+".ts", data);
             
              getVideoBuffer(contentArr,j)
            });
          });
    }else{
        console.log('start convert');
        exec(`ffmpeg -i ./media-ts/${filename}.ts ./media/${filename.split('.')[0]}.mp4`, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          
          console.log('convert done');
        })
        return 
    }
}

module.exports = function(res,req){
  var i = 0
  mapUrl = decodeURIComponent(res.query.url)
  getTsMap(res,req,i);
}


