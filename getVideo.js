const http = require("https");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
let hostName = "";
let filename = "";
let mapUrl = ''
const getTsMap = function (req,res,i) {
  let pathStr = mapUrl.split("/");
  filename = pathStr.pop();

  hostName = pathStr.join("/");
  http.get(mapUrl, function (message) {
    let data = Buffer.alloc(0);
    message.on("data", function (chunk) {
      data = Buffer.concat([data, chunk]);
    });
    message.on("end", function () {
      const content = data.toString();
      console.log(content);

      if(content.indexOf('html')>-1){
        res.end('error')
        return
      }
      const contentArr = content.split("\n");
      console.log(contentArr);
      var bufferArr = []
      if(contentArr.length>0){
        for (let i = 0; i < contentArr.length; i++) {
          const ele = contentArr[i];
          if (ele.indexOf(".ts") > -1||ele.indexOf(".jpg")>-1) {
              bufferArr.push(ele)
            } else {
            }
        }
        fs.writeFileSync('./media-ts/'+filename+".ts", '');
        res.end('downloading……')
        getVideoBuffer(bufferArr,i)
      } else {
        res.end('error')
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

module.exports = function(req,res){
  var i = 0
  mapUrl = decodeURIComponent(req.query.url)
  getTsMap(req,res,i);
}


