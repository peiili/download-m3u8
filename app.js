var http = require('http');
var path = require('path');
var querystring = require('querystring')
var fs = require('fs')

var getVideo = require('./getVideo')
var getTs = require('./get-ts');

var app = http.createServer((req, res)=>{
  var queryPath = req.url.split('?')[0]
  var search = req.url.split('?')[1]
  var searchObj = querystring.parse(search)
  req.query = searchObj
  console.log('14',/\/libs\/*/.test(queryPath));
  if(queryPath === '/'){
    var template = fs.readFileSync('./index.html','utf-8')
    var list = fs.readdirSync('./media')
    var li = '' 
    for (var i = 0; i < list.length; i++) {
      var ele = list[i]
      ele = decodeURIComponent(ele)
      li += `<li>
                <a href="./video.html?url=/media/${ele}/index.m3u8">
                ${ele}
            </li>`
    }
    var ul = `<ul>${li}</ul>` 
    var content =  template.replace('{{ul}}',ul)
    res.end(content)
  }else if(/^\/video\/*/.test(queryPath)){
    var url  = req.query.url
    var template = fs.readFileSync('./video.html','utf-8')
    var str = `<video-js id=vid1 width=600 height=300 class="vjs-default-skin" controls>
                  <source
                    src="${url}"
                    type="application/x-mpegURL">
                </video-js>`
    var content =  template.replace('{{video}}',str)
    res.end(content)
  } else if(/^\/libs\/*/.test(queryPath)){
    console.log('queryPath',queryPath);
    fs.readFile(path.join(__dirname,queryPath),function(err,file){
      if(err){
        throw err
      }
      res.end(file)
    })
  } else if(queryPath === '/getvideo') {
    getVideo(req,res)
  }else if(/\/media\/*/.test(queryPath)) {
    if(fs.existsSync(path.join(__dirname,queryPath))){
      var file = fs.readFileSync(path.join(__dirname,queryPath))
      res.end(file)
    }else{
      res.end()
    }
  }else if(queryPath === '/get-ts') {
    getTs(req,res)
  } else{
    res.end('')
  }
})

app.listen('3000', ()=>{
	console.log('you app run 3000')
})
