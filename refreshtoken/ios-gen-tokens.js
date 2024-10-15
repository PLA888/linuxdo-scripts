const TOKEN_URL_NEO = 'https://token.oaifree.com/api/auth/refresh';
const TOKEN_URL_OAI = 'https://auth0.openai.com/oauth/token';

// 从环境变量中获取 refresh_token
const ENV_REFRESH_TOKEN = globalThis.refresh_token || '';

async function handleRequest(request) {
    const { pathname } = new URL(request.url);

    // 根路径返回 HTML 页面
    if (pathname === "/") {
        return new Response(generateHTML(), {
            headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        });
    } 
    // /get-token 路径获取 Access Token
    else if (pathname === "/get-token") {
        const formData = await request.formData();
        const refreshToken = formData.get("refresh_token");
        const mode = formData.get("mode");
        return await getAccessToken(refreshToken, mode);
    } 
    // 其他路径返回 404
    else {
        return new Response("Not Found", { status: 404 });
    }
}

// 获取 access token 的函数
async function getAccessToken(refreshToken, mode) {
    let url = mode === 'oai' ? TOKEN_URL_OAI : TOKEN_URL_NEO;
    let body, headers;

    if (mode === 'neo') {
        headers = { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' };
        body = `refresh_token=${encodeURIComponent(refreshToken)}`;
    } else {
        headers = { 'Content-Type': 'application/json' };
        body = JSON.stringify({
            redirect_uri: "com.openai.chat://auth0.openai.com/ios/com.openai.chat/callback",
            grant_type: "refresh_token",
            client_id: "pdlLIX2Y72MIl2rhLhTE9VV9bN905kBh",
            refresh_token: refreshToken
        });
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body
    });
    
    const result = await response.json();
    if (result.access_token) {
        return new Response(JSON.stringify({ access_token: result.access_token }), {
            headers: { 'Content-Type': 'application/json;charset=UTF-8' }
        });
    } else {
        return new Response(JSON.stringify({ error: result.detail || '获取失败，请检查Refresh Token是否正确' }), {
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            status: 400
        });
    }
}

// 生成美化后的 HTML 页面
function generateHTML() {
    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Access Token 获取工具</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #F0F8FF;
                padding: 20px;
                margin: 0;
            }
            .container {
                max-width: 600px;
                margin: 50px auto;
                padding: 30px;
                background-color: #FFFFFF;
                border: 2px solid #87CEFA;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(135, 206, 250, 0.2);
                text-align: center;
            }
            h1 {
                color: #4682B4;
            }
            button, select {
                padding: 12px 24px;
                margin-top: 20px;
                font-size: 16px;
                font-weight: bold;
                color: #FFFFFF;
                background-color: #87CEFA;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s ease;
            }
            button:hover {
                background-color: #4682B4;
            }
            input, textarea {
                width: 90%;
                margin: 20px auto;
                padding: 15px;
                border: 2px solid #87CEFA;
                border-radius: 5px;
                font-size: 14px;
                display: block;
            }
            #copyButton {
                display: none;
            }
            .button-container {
                display: flex;
                justify-content: space-around;
                flex-wrap: wrap;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Access Token 获取工具</h1>
            <label for="modeSelect">选择模式:</label>
            <select id="modeSelect">
                <option value="neo" selected>Neo</option>
                <option value="oai">OAI</option>
            </select>
            <input type="text" id="refreshTokenInput" placeholder="请输入您的 Refresh Token" value="${ENV_REFRESH_TOKEN}">
            <button id="getTokenButton">获取 Access Token</button>
            <textarea id="accessTokenText" readonly placeholder="获取到的 Access Token 将显示在此处"></textarea>
            <div class="button-container">
                <button id="copyButton">点击复制</button>
                <button id="jumpButton">前往 GPT</button>
            </div>
        </div>
    
        <script>
            document.getElementById('getTokenButton').addEventListener('click', async () => {
                const refreshToken = document.getElementById('refreshTokenInput').value;
                const mode = document.getElementById('modeSelect').value;
                if (!refreshToken) {
                    alert('请输入您的 Refresh Token');
                    return;
                }
                try {
                    const response = await fetch('/get-token', {
                        method: 'POST',
                        body: new URLSearchParams({ refresh_token: refreshToken, mode: mode })
                    });
                    const data = await response.json();
                    if (data.access_token) {
                        const accessTokenText = document.getElementById('accessTokenText');
                        accessTokenText.value = data.access_token;
                        document.getElementById('copyButton').style.display = 'inline';
                    } else {
                        alert('获取 Access Token 失败: ' + data.error);
                    }
                } catch (error) {
                    alert('请求出错，请检查网络连接或刷新页面重试。');
                    console.error(error);
                }
            });
    
            document.getElementById('copyButton').addEventListener('click', () => {
                const accessTokenText = document.getElementById('accessTokenText');
                accessTokenText.select();
                document.execCommand('copy');
                const copyButton = document.getElementById('copyButton');
                copyButton.textContent = '已复制';
                setTimeout(() => {
                    copyButton.textContent = '点击复制';
                }, 3000);
            });
    
            document.getElementById('jumpButton').addEventListener('click', () => {
                window.location.href = 'https://new.oaifree.com/';
            });
        </script>
    </body>
    </html>
    `;
}

// 监听 fetch 事件
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});
