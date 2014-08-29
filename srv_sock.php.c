<?php

define("DEBUG", true);

require_once("srv_jang0602.php.c");
if(DEBUG) {
  require_once("testcase1.php.c");
 } else {
  $jang_cond = new JongTable;
  $jang_cond->jp = array();
  $jang_cond->haifu = array();
 }
$socks = new SocketHandler;
$socks->start_server();

class SocketHandler{
  var $socket;
  var $existing_changed = array();
  var $meibo = array();
  var $clients = array();
  var $host = 'localhost'; //host
  var $port = '9000'; //port

  function init_server() {
    //Create TCP/IP sream socket
    $socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
    //reuseable port
    socket_set_option($socket, SOL_SOCKET, SO_REUSEADDR, 1);
    
    //bind socket to specified host
    socket_bind($socket, 0, $this->port);
    
    //listen to port
    socket_listen($socket);
    $this->clients = array($socket);
    $this->socket = $socket;
  }


  function start_server() {
    $null = NULL; //null var
    $this->init_server();

    while (true) {
      //manage multiple connections
      $chgclients = $this->clients;
      //$chgclients にソケットリソースが格納されて返る
      socket_select($chgclients, $null, $null, 0, 10);

      $this->check_new_connected_client($chgclients);

      //loop through all connected sockets      
      foreach ($chgclients as $sock) {	
	if($this->check_incomming_data($sock)) continue;
	$this->check_disconnected_client($sock);
      }
    }
    socket_close($this->socket);
  }

  //function check_new_socket
  function check_new_connected_client(&$chgclients) {
    if (!in_array($this->socket, $chgclients)) return;
    $socket_new = socket_accept($this->socket); //accept new socket
    $this->clients[] = $socket_new; //add socket to client array
    
    $header = socket_read($socket_new, 1024); //read data sent by the socket
    //websocket handshake
    $this->perform_handshaking($header, $socket_new, $this->host, $this->port); 

    if(0) {    
      socket_getpeername($socket_new, $ip); //get ip address of connected socket
      $response = $this->mask(json_encode(array('type'=>'system', 'message'=>$ip.' connected'))); //prepare json data
      $this->send_message($response); //notify all users about new connection
    }

    //make room for new socket
    $found_socket = array_search($this->socket, $chgclients);
    unset($chgclients[$found_socket]);
  }
    

  function check_incomming_data($sock) {
    while(socket_recv($sock, $buf, 1024, 0) >= 1)
    {
      $received_text = $this->unmask($buf); //unmask data
      $got_msg = json_decode($received_text); //json decode 
      if(DEBUG) {
	echo "<<Incomming Data>>";
	var_dump($got_msg);
      }
      // ログインの場合と配布の場合で、ここで仕切る
      if($this->check_player_status($got_msg, $sock)) return true;
      
      srv_sockrecv_handler($got_msg, $sock);
      return true; //exit this loop
    }
    return false;
  }
   
  function check_disconnected_client($sock) {
    $buf = @socket_read($sock, 1024, PHP_NORMAL_READ);
    if ($buf !== false) return;
    // remove client for $this->clients array
    $found_socket = array_search($sock, $this->clients);
    socket_getpeername($sock, $ip);
    unset($this->clients[$found_socket]);
    
    //notify all users about disconnected connection
    $response = $this->mask(json_encode(array('type'=>'system', 
				       'message'=>$ip.' disconnected')));
    $this->send_message($response);
  }


  function check_player_status($got_msg, $sock)
  {
    global $jang_cond;
    $meibo = $this->meibo;

    if($got_msg->sb === "login") {
      //$player = $got_msg->player;
      // TODO: playerが $jang_cond->jp[x]->token にいるかどうかの確認 */
      $token = rand(1, 0xffff);
      // TODO: token が重複しているかどうかの確認
      $msg = $this->mask(json_encode(array('type'=>'login', 'token'=>$token)));
      @socket_write($sock, $msg, strlen($msg));
      $this->meibo[$token] = true;
      $new_jp = new JangPlayer;
      $new_jp->token = $token;
      $new_jp->name = $got_msg->name;
      $new_jp->wind = -1;
      array_push($jang_cond->jp, $new_jp);
      echo count($jang_cond->jp) ." gatherring...\n";
      if(count($jang_cond->jp) < 4) return true;
      $obj = new stdClass;
      $obj->sb = "init";
      srv_sockrecv_handler($obj, 0);

      return false;
    
    }
    if($got_msg->sb === "debug") {
      $tokens = array();
      foreach($jang_cond->jp as $jp) {
	array_push($tokens, $jp->token);
      }
      $pack = array('type'=>'debug', 'tokens'=>implode(";",$tokens));
      $msg = $this->mask(json_encode($pack));
      @socket_write($sock, $msg, strlen($msg));

      foreach($tokens as $token) $this->meibo[$token] = true;

      return true;
    }

    $player = $got_msg->player * 1;
    if(isset($meibo[$player]) && @$this->existing_changed[$player] != $sock){
      $this->existing_changed[$player] = $sock;
    }
    return false;

  }

  function send_message($msg, $player = -1)
  {
    if(DEBUG) {
      echo"<<existing_changed>>";
      var_dump($this->existing_changed);
    }

    if($player < 0) {
      foreach($this->clients as $sock) {
	@socket_write($sock, $msg, strlen($msg));
      }
    } else if(isset($this->existing_changed[$player])) {
      @socket_write($this->existing_changed[$player], $msg, strlen($msg));
    }
    return true;
  }


  //Unmask incoming framed message
  function unmask($text) {
    $length = ord($text[1]) & 127;
    if($length == 126) {
      $masks = substr($text, 4, 4);
      $data = substr($text, 8);
    }
    elseif($length == 127) {
      $masks = substr($text, 10, 4);
      $data = substr($text, 14);
    }
    else {
      $masks = substr($text, 2, 4);
      $data = substr($text, 6);
    }
    $text = "";
    for ($i = 0; $i < strlen($data); ++$i) {
      $text .= $data[$i] ^ $masks[$i%4];
    }
    return $text;
  }

  //Encode message for transfer to client.
  function mask($text)
  {
    $b1 = 0x80 | (0x1 & 0x0f);
    $length = strlen($text);
  
    if($length <= 125)
      $header = pack('CC', $b1, $length);
    else if(125 < $length && $length < 65536)
      $header = pack('CCn', $b1, 126, $length);
    else if($length >= 65536)
      $header = pack('CCNN', $b1, 127, $length);
    return $header.$text;
  }

  //handshake new client.
  function perform_handshaking($receved_header,$client_conn, $host, $port)
  {
    $headers = array();
    $lines = preg_split("/\r\n/", $receved_header);
    foreach($lines as $line)
      {
	$line = chop($line);
	if(preg_match('/\A(\S+): (.*)\z/', $line, $matches))
	  {
	    $headers[$matches[1]] = $matches[2];
	  }
      }
  
    $secKey = $headers['Sec-WebSocket-Key'];
    $secAccept = base64_encode(pack('H*', sha1($secKey . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')));
    //hand shaking header
    $upgrade  = "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" .
      "Upgrade: websocket\r\n" .
      "Connection: Upgrade\r\n" .
      "WebSocket-Origin: $host\r\n" .
      "WebSocket-Location: ws://$host:$port/demodatte/shout.php\r\n".
      "Sec-WebSocket-Accept:$secAccept\r\n\r\n";
    socket_write($client_conn,$upgrade,strlen($upgrade));
  }
}
