#!/usr/local/bin/ruby

LAST_MODIFIED = "2011/02/12 SAT 17:28:04 JST"

$LOAD_PATH.push(".")
require "socket"
require "login_manager"

PORT = 31557
PROTOCOL = "0.1.1 beta"
DIV = ';'

daemon = TCPServer.open(PORT)

manager = LoginManager.new
threads = Hash.new

Thread.new( manager ) do |manager|
  loop do
    manager.start_game
    sleep(1)
  end
end

loop do
  
  # Wait User's Access
  socket =  daemon.accept

  # Login Proccess
  Thread.new( manager , socket ){ #do |manager,socket|

    begin
      
      if( socket.gets.strip != PROTOCOL)
        socket.puts( "perror" )
        socket.close
        kill
      end
      socket.puts( "void" )
      
      while true
        name = socket.gets.strip
        
        redo   if( name == "" )
        
        if( manager.add_user( name , socket ) )
          socket.puts( "void" )
          break
        else
          socket.puts( "rename" )
        end
        
      end
      
    rescue
      kill
    end

    manager.wait( name )

  }

end

daemon.close
