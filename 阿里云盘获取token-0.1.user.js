// ==UserScript==
// @name         阿里云盘获取token
// @namespace    https://wyq.icu/
// @version      0.1
// @description  用于复制阿里云盘token进行签到
// @author       专科北极熊
// @match        https://www.aliyundrive.com/drive*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wyq.icu
// @grant        none
// @downloadURL https://update.greasyfork.org/scripts/463087/%E9%98%BF%E9%87%8C%E4%BA%91%E7%9B%98%E8%8E%B7%E5%8F%96token.user.js
// @updateURL https://update.greasyfork.org/scripts/463087/%E9%98%BF%E9%87%8C%E4%BA%91%E7%9B%98%E8%8E%B7%E5%8F%96token.meta.js
// ==/UserScript==

(function() {
    'use strict';
    window.onload = function(){
        let token = JSON.parse(localStorage.token).refresh_token; // 获取token
        console.log(token);
        // 创建只读文本框
        var input = document.createElement("input");
        input.type = "text";
        input.readOnly = true;
        input.value = token;
        input.id = "token_value";
        // 添加样式
        input.style.width = "300px";
        input.style.padding = "10px";
        input.style.backgroundColor = "#f0f0f0";
        input.style.border = "1px solid black";
        input.style.marginRight = "10px";
        input.style.borderRadius="12px";
        // 创建复制按钮
        var button = document.createElement("button");
        button.innerText = "复制";
        button.addEventListener("click", function() {
            input.select();
            document.execCommand("copy");
            alert("已复制到剪贴板");
        });
        // 添加样式
        button.style.width = "100px";
        button.style.padding = "10px";
        button.style.backgroundColor = "#4CAF50";
        button.style.border = "none";
        button.style.color= "white";
        button.style.borderRadius="12px";

        // 创建包裹文本框和复制按钮的div
        var wrapper = document.createElement("div");
        wrapper.style.position = "fixed";
        wrapper.style.bottom = "0";
        wrapper.style.right = "0";
        wrapper.style.width = "350px";
        wrapper.style.display = "flex";
        wrapper.style.justifyContent = "space-between";
        wrapper.style.alignItems = "center";
        wrapper.style.zIndex = "9999";
        // 将文本框和复制按钮添加至包裹div中
        wrapper.appendChild(input);
        wrapper.appendChild(button);
        // 将包裹div添加至页面中
        document.body.appendChild(wrapper);
    }
})();