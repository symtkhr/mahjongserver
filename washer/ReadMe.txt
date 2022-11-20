<JunkSpace>

●使い方
#下準備(既にインスコ済なら省略可能)
sudo apt-get install php

#鯖起動
cd srv
php srvJunkSpace.php

#蔵(ブラウザ)起動
http://localhost/washer/client/login_junk.html
	
●接続構成
[./client/websocket.js] 
　↑↓ ws://(どっかの鯖):9000
[./server/srvJunkSpace.php] with required modules


