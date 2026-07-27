var http = require('http');
var path = require('path');
var querystring = require('querystring')
var fs = require('fs')

var getVideo = require('./getVideo')
var getTs = require('./get-ts');
var download = require('./views/download')

// 辅助函数：递归删除目录
function removeDirectorySync(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        removeDirectorySync(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

// 辅助函数：读取 POST 数据
function readPostData(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      callback(null, data);
    } catch (e) {
      callback(e);
    }
  });
}

var app = http.createServer((req, res)=>{
  var queryPath = req.url.split('?')[0]
  var search = req.url.split('?')[1]
  var searchObj = querystring.parse(search)
  req.query = searchObj
  console.log(req.url)
  if(queryPath === '/'){
    var template = fs.readFileSync('./index.html','utf-8')
    var list = fs.readdirSync('./media')
    var cards = ''
    for (var i = 0; i < list.length; i++) {
      var ele = list[i]
      var displayName = decodeURIComponent(ele)
      var videoUrl = `/video?url=/media/${encodeURIComponent(ele)}/index.m3u8`

      // 生成视频卡片
      cards += `
        <a href="${videoUrl}" class="video-card">
          <div class="video-thumbnail">
            🎬
            <div class="play-icon">▶️</div>
          </div>
          <div class="video-info">
            <div class="video-title">${displayName}</div>
            <div class="video-meta">
              <span>📁 HLS</span>
            </div>
          </div>
        </a>
      `
    }
    var content = template.replace('{{ul}}', cards)
    res.end(content)
  }else if(/^\/video\/*/.test(queryPath)){
    var url  = req.query.url
    var template = fs.readFileSync('./video.html','utf-8')
    var str = `<video id="vid1" class="video-js vjs-default-skin" controls preload="auto">
                  <source
                    src="${url}"
                    type="application/x-mpegURL">
                </video>`
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
  } else if(/^\/media(?:\/|$)/.test(queryPath)) {
    console.log(fs.existsSync(path.join(__dirname, queryPath)));
    console.log(path.join(__dirname, queryPath));

    if (fs.existsSync(path.join(__dirname, queryPath))) {

      var file = fs.readFileSync(path.join(__dirname,queryPath))
      res.end(file)
    }else{
      res.end()
    }
  }else if(queryPath === '/get-ts') {
    getTs(req,res)
  } else if(queryPath === '/views/download'){
    download(req, res)
  } else if(queryPath === '/views/download-video'){
    // downloadVideo(req, res)
  } else if(queryPath === '/media-manager') {
    var template = fs.readFileSync('./media-manager.html','utf-8')
    var list = fs.readdirSync('./media')
    var mediaList = list.map(item => decodeURIComponent(item))
    var content = template
      .replace('{{mediaItems}}', list.map((item, index) => {
        var displayName = mediaList[index]
        return `
        <div class="media-item">
          <div class="media-info">
            <div class="media-name">🎬 ${displayName}</div>
            <div class="media-path">路径: /media/${encodeURIComponent(item)}</div>
          </div>
          <div class="media-actions">
            <button class="btn btn-rename" onclick="openRenameModal('${displayName.replace(/'/g, "\\'")}')">
              ✏️ 重命名
            </button>
            <button class="btn btn-delete" onclick="openDeleteModal('${displayName.replace(/'/g, "\\'")}')">
              🗑️ 删除
            </button>
          </div>
        </div>
      `
      }).join(''))
      .replace('{{mediaList}}', JSON.stringify(mediaList))
      .replace('{{mediaListRaw}}', JSON.stringify(list))
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})
    res.end(content)
  } else if(queryPath === '/api/delete-media') {
    if(req.method !== 'POST') {
      res.writeHead(405, {'Content-Type': 'application/json'})
      res.end(JSON.stringify({error: 'Method not allowed'}))
      return
    }
    readPostData(req, (err, data) => {
      if(err) {
        res.writeHead(400, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({error: 'Invalid JSON'}))
        return
      }
      var mediaName = data.name
      if(!mediaName) {
        res.writeHead(400, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({error: 'Media name is required'}))
        return
      }
      try {
        var mediaPath = path.join(__dirname, 'media', mediaName)
        removeDirectorySync(mediaPath)
        res.writeHead(200, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({success: true, message: 'Media deleted successfully'}))
      } catch(error) {
        console.error('Delete error:', error)
        res.writeHead(500, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({error: 'Failed to delete media: ' + error.message}))
      }
    })
  } else if(queryPath === '/api/rename-media') {
    if(req.method !== 'POST') {
      res.writeHead(405, {'Content-Type': 'application/json'})
      res.end(JSON.stringify({error: 'Method not allowed'}))
      return
    }
    readPostData(req, (err, data) => {
      if(err) {
        res.writeHead(400, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({error: 'Invalid JSON'}))
        return
      }
      var oldName = data.oldName
      var newName = data.newName
      if(!oldName || !newName) {
        res.writeHead(400, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({error: 'Old name and new name are required'}))
        return
      }
      try {
        var oldPath = path.join(__dirname, 'media', oldName)
        var newPath = path.join(__dirname, 'media', newName)
        if(!fs.existsSync(oldPath)) {
          res.writeHead(404, {'Content-Type': 'application/json'})
          res.end(JSON.stringify({error: 'Media not found'}))
          return
        }
        if(fs.existsSync(newPath)) {
          res.writeHead(400, {'Content-Type': 'application/json'})
          res.end(JSON.stringify({error: 'A media with that name already exists'}))
          return
        }
        fs.renameSync(oldPath, newPath)
        res.writeHead(200, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({success: true, message: 'Media renamed successfully'}))
      } catch(error) {
        console.error('Rename error:', error)
        res.writeHead(500, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({error: 'Failed to rename media: ' + error.message}))
      }
    })
  }  else{
    res.end('')
  }
})

app.listen('3845', ()=>{
	console.log('you app run 3845')
})
