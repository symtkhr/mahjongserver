/*
  The stuff I want to make:
  * client = haifu_seq.js + websock.js (this)
  * server = only send haifu $haifu_demo = array(96); (as written in haifu_seq.html)
  * use case = 
    [cast] 
     1 jang table / an operating client / many other watching clients (audience).
    [case]
     The operating client sends its current step
    [reaction] 
     The server will send all clients the haifu from zero to the specified step.
     All clients will receive the haifu.
    [case]
     The audient client sends its current step
    [reaction] 
     The server will send the clients the haifu from zero to the specified step.
 */

$(document).ready(function(){
    //create a new WebSocket object.
    var wsUri = "ws://localhost:9000/nandemo/server.php"; 	
    var websocket = new WebSocket(wsUri); 
    
    websocket.onopen = function(ev) { // connection is open 
      $('#message_box').append('<div class="system_msg">Connected!</div>'); //notify user
    }
    
    $('#send-btn').click(function(){ //use clicks message send button	
	var mymessage = $('#message').val(); //get message text
	var myname = $('#name').val(); //get user name
	
	if(mymessage === "")  mymessage = "12";
	
	//prepare json data
	var msg = {
	  message: mymessage,
	  name: myname,
	  color: '#0cc'
	};
	//convert and send data to server
	websocket.send(JSON.stringify(msg));
      });
    
    //#### Message received from server?
    websocket.onmessage = function(ev) {
      var msg = JSON.parse(ev.data); //PHP sends Json data
      var type = msg.type; //message type
      var umsg = msg.message; //message text
      var uname = msg.name; //user name
      var ucolor = msg.color; //color
      
      if(type == 'usermsg') 
   	$('#message_box').append('<div><span class="user_name">' + uname + '</span> : <span class="user_message">' + umsg + "</span></div>");
   
      if(type == 'system')
   	$('#message_box').append('<div class="system_msg">' + umsg + "</div>");
      
      
      $('#message').val(''); //reset text
    };
    
    websocket.onerror = function(ev){$('#message_box').append('<div class="system_error">Error Occurred - ' + ev.data + "</div>");}; 
    websocket.onclose = function(ev){$('#message_box').append('<div class="system_msg">Connection Closed</div>');}; 
});
