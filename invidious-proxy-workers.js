// 源自：免富强观看 YouTube 新思路 https://linux.do/t/topic/179164
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // 检查访问者的国家/地区
  const country = request.headers.get('cf-ipcountry');

  // 仅允许中国大陆地区访问
  if (country !== 'CN') {
    return new Response('Unauthorized', { status: 401 });
  }

  // 检查是否已经提交了密码
  const cookie = request.headers.get('Cookie');
  const submittedPassword = url.searchParams.get('password');

  if (cookie && cookie.includes('authenticated=true')) {
    // 如果已经通过认证，转发请求到目标 URL
    return await forwardRequest(request, url);
  } else if (submittedPassword) {
    // 验证提交的密码
    if (submittedPassword === '888888') {
      // 设置认证 Cookie
      return new Response('Authenticated! Redirecting...', {
        status: 302,
        headers: {
          'Set-Cookie': 'authenticated=true; Max-Age=3600', // 1小时有效期
          'Location': url.origin + url.pathname // 重定向到目标路径
        }
      });
    } else {
      // 密码错误
      return new Response('Unauthorized', { status: 401 });
    }
  } else {
    // 返回密码输入页面
    return new Response(generatePasswordPage(), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// 转发请求到目标 URL
async function forwardRequest(request, url) {
  const targetUrl = 'https://iv.ggtyler.dev' + url.pathname + url.search;
  return fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
}

// 生成密码输入页面的 HTML
function generatePasswordPage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Enter Password</title>
    </head>
    <body>
      <h1>Please Enter Password to Access</h1>
      <form method="GET">
        <input type="password" name="password" placeholder="Enter Password" required>
        <button type="submit">Submit</button>
      </form>
    </body>
    </html>
  `;
}
