<17歩>

●使い方
#下準備(既にインスコ済なら省略可能)
sudo apt-get install ruby rubygems g++ ruby-dev
sudo gem install em-websocket

#鯖起動
cd server
ruby server.rb &
ruby prxserv.rb -D  # <注意>"&"で起動すると詰みます

#蔵(ブラウザ)起動
http://(srvhost)/step17/client/

●接続構成
[./gui_jsp/jsp_17_websocket.js] 
　↑↓ ws://(どっかの鯖):51234
[./gui_jsp/prxsrv.rb] with required [junkspace_relay.rb] 
　↑↓ localhost:31557
[./juk_space/server/server.rb] with required modules


