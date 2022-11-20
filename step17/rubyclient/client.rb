#!/usr/local/bin/ruby
LAST_MODIFIED = "2011/02/12 SAT 17:28:04 JST"
puts <<EOS

   J U N K _S P A C E

   Last modified #{LAST_MODIFIED}
   kshimada

EOS

require "socket"

require "games"
require "subroutines"

HOST = "localhost"
PORT = 31557
DIV = ';'
BS = "%c" % 8

PROTOCOL = "0.1.1 beta"

games = Games.new

#------------------------------------------------------------------------------
socket = openSocket(HOST,PORT)

socket.puts( PROTOCOL )

if( socket.gets.strip == "perror" ) then
  STDOUT.puts( "Protocol Version Error !!" )
  exit
end

loop do
  print( "Enter Your Name: " )
  redo   if( ( name = STDIN.gets.strip ) == "" )

  socket.puts( name )

  if( socket.gets.strip == "rename" )
    STDOUT.puts( "Name '#{name}' Already Used." )
  else
    break
  end
end

thread = send_thread( socket )

loop do
  
  prompt
  command = socket.gets.strip.split( DIV )
  
  print BS * 2
  STDOUT.flush
  
  case command.shift.strip
  when "void"
    redo

  when "login"
    STDOUT.puts( "[#{command.join(DIV)}] is Logged in." )

  when "logout"
    STDOUT.puts( "[#{command.join(DIV)}] was Logged out." )

  when "logins"
    STDOUT.puts( "Login:   " + command.join(', ') )

  when "state"
    index = command.shift.to_i
    command.shift
    name = command.shift
    max = command.shift.to_i
    login = command.size
    STDOUT.puts( "%d: %s %d / %d" % [index,name.ljust(16),login,max] )

  when "game_start"
    Thread.kill( thread )
    games.start( command.shift , socket )
    thread = send_thread( socket )

  when "chat"
    from = command.shift
    STDOUT.puts( "from [#{from}]: " + command.join(DIV) )

  when "unknown"
    STDOUT.puts( "Unknown Command." )

  when "quit"
    exit

  end
  
end

socket.close
