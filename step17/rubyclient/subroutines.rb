MAX_RETRY = 5

def prompt
  print( "> " )
  STDOUT.flush
end

def openSocket( host , port )
    
  error_cnt = 0
  while( error_cnt < MAX_RETRY )
    begin
      sock = TCPSocket.open( host , port )
      return sock
    rescue
      error_cnt += 1
      sleep(1)
    end
    
  end
  
  STDOUT.puts "Connection Error !!"
  exit()

end

def send_thread( socket )
  
  thread = Thread.new( socket ) do |socket|
    loop do
      
      message = STDIN.gets
      prompt
      socket.puts( message )
      
    end
  end

  return thread

end
