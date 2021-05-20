window.APP = {
	//本地开发配置
	serverURL: "http://192.168.1.247:9000",
	imageURL: "http://192.168.1.247:9000/images",
	chatServer: "ws://192.168.1.247:7000/chat",
	
	//发布到服务器时配置
	/* serverURL: "http://39.99.188.1/BlueSeaChatServer",
	imageURL: "http://39.99.188.1/image/BlueSeaChat",
	chatServer: "ws://39.99.188.1:7000/chat", */
	
	//返回index页面是否刷新页面
	setIsReloadIndex: function(flag) {
		plus.storage.setItem("isReloadIndex", flag.toString());
	},
	getIsReloadIndex: function() {
		return plus.storage.getItem("isReloadIndex") == 'true';
	},
	//个人信息
	setUserInfo: function(userInfo) {
		var user_info_str = JSON.stringify(userInfo);
		plus.storage.setItem("user_info", user_info_str);
	},
	getUserInfo: function() {
		var userInfo = plus.storage.getItem("user_info");
		return JSON.parse(userInfo);
	},
	//聊天窗口
	setChatWindow: function(item) {
		var chatWindows = localStorage.getItem("chatWindows" + APP.getUserInfo().account);
		if (chatWindows == null || chatWindows == "") {
			var obj = [];
			obj.push(item);
			localStorage.setItem("chatWindows" + APP.getUserInfo().account, JSON.stringify(obj));
			return true;
		} else {
			var obj = JSON.parse(chatWindows);
			for (var i = 0; i < obj.length; i++) {
				if (obj[i].account == item.account) {
					return false;
				}
			}
			obj.push(item);
			localStorage.setItem("chatWindows" + APP.getUserInfo().account, JSON.stringify(obj));
			return true;
		}
	},
	getChatWindows: function() {
		var chatWindows = localStorage.getItem("chatWindows" + APP.getUserInfo().account);
		if (chatWindows == null || chatWindows == "") {
			return [];
		} else {
			return JSON.parse(chatWindows);
		}
	},
	delChatWindow : function(account){
		var chatWindows = localStorage.getItem("chatWindows" + APP.getUserInfo().account);
		if (chatWindows != null && chatWindows != "") {
			var cws = JSON.parse(chatWindows);
			mui.each(cws,function(num,item){
				if(item.account == account){
					cws.splice(num,1);
					localStorage.setItem("chatWindows" + APP.getUserInfo().account, JSON.stringify(cws));
					return;
				}
			});
		}
	},
	updateChatWindow : function(account,image){
		var chatWindows = localStorage.getItem("chatWindows" + APP.getUserInfo().account);
		if (chatWindows != null && chatWindows != "") {
			var cws = JSON.parse(chatWindows);
			mui.each(cws,function(num,item){
				if(item.account == account){
					var chatWindow = {
						account : item.account,
						userName : item.userName,
						userImage : APP.imageURL + "/userImage/" + image,
						type : item.type,
						role : item.role
					};
					cws.splice(num,1);
					localStorage.setItem("chatWindows" + APP.getUserInfo().account, JSON.stringify(cws));
					APP.setChatWindow(chatWindow);
					return;
				}
			});
		}
	},
	//判断是否存在聊天窗口
	isExistChatWindow : function(account){
		var chatWindows = localStorage.getItem("chatWindows" + APP.getUserInfo().account);
		if(chatWindows == null){
			return 0;
		}
		var obj = JSON.parse(chatWindows);
		for (var i = 0; i < obj.length; i++) {
			if (obj[i].account == account) {
				return 1;
			}
		}
		return 2;
	},
	//聊天记录
	setMsgRecord: function(item, account) {
		var msgRecord = localStorage.getItem("msgRecord" + APP.getUserInfo().account + "-" + account);
		if (msgRecord == null || msgRecord == "") {
			var obj = [];
			obj.push(item);
			localStorage.setItem("msgRecord" + APP.getUserInfo().account + "-" + account, JSON.stringify(obj));
			return true;
		} else {
			var obj = JSON.parse(msgRecord);
			obj.push(item);
			localStorage.setItem("msgRecord" + APP.getUserInfo().account + "-" + account, JSON.stringify(obj));
			return true;
		}
	},
	getMsgRecord: function(account) {
		var msgRecord = localStorage.getItem("msgRecord" + APP.getUserInfo().account + "-" + account);
		if (msgRecord == null || msgRecord == "") {
			return [];
		} else {
			return JSON.parse(msgRecord);
		}
	},
	delMsgRecord : function(account){
		localStorage.removeItem("msgRecord" + APP.getUserInfo().account + "-" + account);
	},
	//清除所有聊天记录
	clearAllMsg: function() {
		localStorage.clear();
		return true;
	},
	//上传文件结果转换
	analysisUpload: function(res) {
		return JSON.parse(res.responseText);
	},
	//获取时间
	getDateTime: function() {
		//当前时间
		var nd = new Date();
		var nyear = nd.getFullYear();
		var nmonth = nd.getMonth() + 1;
		var nday = nd.getDate();
		var nhour = nd.getHours();
		var nmin = nd.getMinutes();
		var sec = nd.getSeconds();

		return (nyear + "-" + nmonth + "-" + nday + " " + nhour + ":" + nmin + ":" + sec);
	},
	//WebSocket
	WebSocket: null,
	initWebSocket: function() {
		if (window.WebSocket) {
			if (APP.WebSocket != null) {
				return;
			}
			APP.WebSocket = new WebSocket(APP.chatServer);
			APP.WebSocket.onopen = function() {
					var param = {
						"msgCode": 100,
						"fromAccount": APP.getUserInfo().account
					};
					APP.WebSocket.send(JSON.stringify(param));
					console.log("success");
				},
				APP.WebSocket.close = function() {
					console.log("close");
				},
				APP.WebSocket.onerror = function() {
					console.log("onerror");
				},
				APP.WebSocket.onmessage = function(e) {
					var data = JSON.parse(e.data);
					var msgCode = data.msgCode;
					if (msgCode == 100) { //建立连接消息

					} else if (msgCode == 101) { //聊天消息
						var recv = {
							sender: 'zs',
							type: 'text',
							content: data.context
						};
						APP.setMsgRecord(recv);
						var num = localStorage.getItem("unreadNum" + data.fromAccount);
						if (num == null) {
							num = 0;
							localStorage.setItem("unreadNum" + data.fromAccount, 0);
						}
						num = parseInt(num) + 1;
						console.log("num:::" + num);
						var obj = plus.webview.getWebviewById("message.html");
						obj.evalJS('msg.setUnreadNum(' + num + ',"' + data.fromAccount + '")');
					} else if (msgCode == 102) { //申请消息

					}
				}
		} else {
			mui.toast("版本过低");
		}
	},
	sendMsg: function(msg) {
		APP.WebSocket.send(JSON.stringify(msg));
	}
};
