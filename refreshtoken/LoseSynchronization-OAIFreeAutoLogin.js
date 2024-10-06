// 源自：https://linux.do/t/topic/108366
// ==UserScript==
// @name         OAIFree Auto Login
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  自动判断st是否过期，如果过期则重新获取，并自动跳转登陆，同时在控制台打印日志输出
// @author       You
// @match        https://new.oaifree.com/auth/login_auth0
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      token.oaifree.com
// @connect      chat.oaifree.com
// ==/UserScript==

(function() {
    'use strict';

    const refreshToken = 'xxxxxx';  // 替换为你的 refresh token

    // 获取当前时间戳
    function getCurrentTimestamp() {
        return Math.floor(Date.now() / 1000);
    }

    // 检查 st 是否过期
    function isSTExpired() {
        const expireAt = GM_getValue('expire_at', 0);
        console.log("st expire at: "+ expireAt )
        return isNaN(expireAt) || getCurrentTimestamp() >= expireAt;
    }

    // 使用 rt 换取 at
    function getAccessToken(refreshToken) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://token.oaifree.com/api/auth/refresh',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: `refresh_token=${refreshToken}`,
                onload: function(response) {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        if(data.access_token){
                            resolve(data.access_token)
                        }else{
                            reject('Failed to generate access token, response: ' + data);
                        }
                    } else {
                        reject('Failed to refresh access token');
                    }
                },
                onerror: function(e) {
                    console.error(e)
                    reject('Failed to refresh access token');
                }
            });
        });
    }

    // 使用 at 生成 st
    function getShareToken(accessToken) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://chat.oaifree.com/token/register',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                data: `unique_name=${generateRandomHex(8)}&access_token=${accessToken}&expires_in=0&site_limit=&gpt35_limit=-1&gpt4_limit=-1&show_conversations=true`,
                onload: function(response) {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        GM_setValue('expire_at', data.expire_at);
                        if(data.token_key){
                            resolve(data.token_key)
                        }else{
                            reject('Failed to generate share token, response: ' + data);
                        }
                    } else {
                        reject('Failed to generate share token');
                    }
                },
                onerror: function(e) {
                    console.error(e)
                    reject('Failed to generate share token');
                }
            });
        });
    }

    // 生成随机字符串
    function generateRandomHex(length) {
        let result = '';
        const characters = '0123456789abcdef';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    // 自动登录
    function autoLogin(shareToken) {
        const loginUrl = `https://new.oaifree.com/auth/login_share?token=${shareToken}`;
        console.log('Logging in with URL: ' + loginUrl);
        window.location.href = loginUrl;
    }

    (async function() {
        try {
            let shareToken = GM_getValue("share_token")
            if (isSTExpired() || !shareToken) {
                console.log('ST token is expired. Refreshing tokens...');
                const accessToken = await getAccessToken(refreshToken);
                console.log('Access token obtained: ' + accessToken);
                shareToken = await getShareToken(accessToken);
                console.log('Share token obtained: ' + shareToken);
                GM_setValue("share_token", shareToken)
            } else {
                console.log('ST token is still valid.');
            }
            autoLogin(shareToken);
        } catch (error) {
            console.error(error);
        }
    })();
})();
