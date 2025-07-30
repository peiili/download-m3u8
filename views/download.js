module.exports = function(req, res){
    res.setHeader('content-type', 'text/html') 

    res.end(`
    <!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API接口调用工具</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }

        .container {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        h1 {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 30px;
            font-size: 2.5em;
            font-weight: 300;
        }

        .form-group {
            margin-bottom: 25px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #34495e;
            font-size: 1.1em;
        }

        input[type="text"], input[type="url"] {
            width: 100%;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s, box-shadow 0.3s;
            box-sizing: border-box;
        }

        input[type="text"]:focus, input[type="url"]:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .button-group {
            display: flex;
            gap: 15px;
            margin-top: 30px;
        }

        button {
            flex: 1;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .call-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .call-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .call-btn:disabled {
            background: #bdc3c7;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .clear-btn {
            background: #e74c3c;
            color: white;
        }

        .clear-btn:hover {
            background: #c0392b;
            transform: translateY(-2px);
        }

        .result {
            margin-top: 30px;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
            background: #f8f9fa;
            display: none;
        }

        .result.success {
            border-left-color: #27ae60;
            background: #d5f4e6;
        }

        .result.error {
            border-left-color: #e74c3c;
            background: #fadbd8;
        }

        .result h3 {
            margin-top: 0;
            color: #2c3e50;
        }

        .result pre {
            background: white;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
            border: 1px solid #e0e0e0;
        }

        .loading {
            display: none;
            text-align: center;
            margin-top: 20px;
        }

        .spinner {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .example {
            background: #f0f8ff;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
            border-left: 4px solid #3498db;
        }

        .example h4 {
            margin-top: 0;
            color: #2980b9;
        }

        .example code {
            background: #e8f4f8;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }

        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .container {
                padding: 20px;
            }
            
            h1 {
                font-size: 2em;
            }
            
            .button-group {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 API接口调用工具</h1>
        
        <form id="apiForm">
            <div class="form-group">
                <label for="urlInput">URL 参数:</label>
                <input type="url" id="urlInput" placeholder="例如: https://easysite.ai.m3u8/project" required>
                <div class="example">
                    <h4>示例:</h4>
                    <code>https://easysite.ai.m3u8/project</code>
                </div>
            </div>
            
            <div class="form-group">
                <label for="nameInput">Name 参数:</label>
                <input type="text" id="nameInput" placeholder="例如: 张三丰" required>
                <div class="example">
                    <h4>示例:</h4>
                    <code>张三丰</code> 或 <code>李四</code>
                </div>
            </div>
            
            <div class="button-group">
                <button type="submit" class="call-btn" id="callBtn">📡 调用接口</button>
                <button type="button" class="clear-btn" onclick="clearForm()">🗑️ 清空表单</button>
            </div>
        </form>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>正在调用接口...</p>
        </div>
        
        <div class="result" id="result">
            <h3 id="resultTitle">调用结果</h3>
            <div id="resultContent"></div>
        </div>
    </div>

    <script>
        document.getElementById('apiForm').addEventListener('submit', function(e) {
            e.preventDefault();
            callApi();
        });

        async function callApi() {
            const urlInput = document.getElementById('urlInput').value.trim();
            const nameInput = document.getElementById('nameInput').value.trim();
            const loadingDiv = document.getElementById('loading');
            const resultDiv = document.getElementById('result');
            const callBtn = document.getElementById('callBtn');
            
            if (!urlInput || !nameInput) {
                showResult('请填写所有必填字段', '', 'error');
                return;
            }
            
            // 显示加载状态
            loadingDiv.style.display = 'block';
            resultDiv.style.display = 'none';
            callBtn.disabled = true;
            
            try {
                // 构建API URL
                const baseUrl = '/get-ts';
                const params = new URLSearchParams({
                    url: urlInput,
                    name: nameInput
                });
                
                const apiUrl = \`\${baseUrl}?\${params.toString()}\`;
                
                console.log('调用URL:', apiUrl);
                
                // 调用API
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                const responseText = await response.text();
                
                if (response.ok) {
                    // 尝试解析JSON，如果失败则显示原始文本
                    let responseData;
                    try {
                        responseData = JSON.parse(responseText);
                    } catch (e) {
                        responseData = responseText;
                    }
                    
                    showResult('调用成功', responseData, 'success');
                } else {
                    showResult(\`调用失败 (HTTP \${response.status})\`, responseText, 'error');
                }
                
            } catch (error) {
                console.error('API调用错误:', error);
                let errorMessage = '网络错误或服务器无响应';
                
                if (error.message.includes('CORS')) {
                    errorMessage = 'CORS跨域错误，请检查服务器配置';
                } else if (error.message.includes('fetch')) {
                    errorMessage = '网络连接失败，请检查服务器是否运行';
                }
                
                showResult('调用失败', errorMessage, 'error');
            } finally {
                // 隐藏加载状态
                loadingDiv.style.display = 'none';
                callBtn.disabled = false;
            }
        }
        
        function showResult(title, content, type) {
            const resultDiv = document.getElementById('result');
            const resultTitle = document.getElementById('resultTitle');
            const resultContent = document.getElementById('resultContent');
            
            resultTitle.textContent = title;
            
            if (typeof content === 'object') {
                resultContent.innerHTML = \`<pre>\${JSON.stringify(content, null, 2)}</pre>\`;
            } else {
                resultContent.innerHTML = \`<pre>\${content}</pre>\`;
            }
            
            resultDiv.className = \`result \${type}\`;
            resultDiv.style.display = 'block';
            
            // 滚动到结果区域
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        }
        
        function clearForm() {
            document.getElementById('urlInput').value = '';
            document.getElementById('nameInput').value = '';
            document.getElementById('result').style.display = 'none';
            document.getElementById('loading').style.display = 'none';
        }
        
        // 页面加载时填入示例数据
        window.onload = function() {
            document.getElementById('urlInput').value = 'https://easysite.ai.m3u8/project';
            document.getElementById('nameInput').value = '张三丰';
        };
    </script>
</body>
</html>    
    `)
}