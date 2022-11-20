#!/usr/bin/env ruby 

require "webrick"
$LOAD_PATH.push(".")
require "junkspace_relay"

#Process.daemon(nochdir=true) if ARGV[0] == "-D"

server = WebSocketServer.new()

#----------------------------------------------------------------
# Main

# Start Server
if( ARGV.index( "-D" ) ) then

  kill_script = Dir::pwd + "/kill.sh"

  WEBrick::Daemon.start do

    open( kill_script , "w" ) do |file|
      file.puts( "#!/bin/sh" )
      file.puts( "kill -9 #{Process.pid}")
    end

    server.start_server()

  end
  
else

  Signal.trap(:INT){ exit }
  server.start_server( true )

end
