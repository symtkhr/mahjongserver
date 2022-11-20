# -*- coding: utf-8 -*-
require "rubygems"
require "em-websocket"
require "socket"
require "thread"

class WebSocketServer
  
  SERVER_HOST = "localhost"
  SERVER_PORT = 31557

  ACCEPT_PORT = 51234
  
  DELIMITER = "_"
  
  #----------------------------------------------------------------
  # Constructor
  def initialize()
    
    # WebSockets
    @websockets = Array.new
        
    TCPSocket.do_not_reverse_lookup = true
    
    @debug_mode = false
    
    @socket_pairs = Hash.new
    @receive_threads = Hash.new

  end
      
  #----------------------------------------------------------------
  # Start Chat Server
  public
  def start_server( debug_mode = false )
    
    @debug_mode = debug_mode
    
    EventMachine::WebSocket.start( :host => "0.0.0.0", :port => ACCEPT_PORT ) do |websocket|

      #--------------------------------
      # Create New Socket
      def create_new_socket( websocket )
        
        socket = TCPSocket.new( SERVER_HOST , SERVER_PORT )

        @socket_pairs[ websocket ] = socket
        @receive_threads[ websocket ] = Thread.new( websocket , socket ) do | websocket , socket |

          loop do
            message = socket.gets().strip()
            websocket.send( message )
            if( message == "QUIT" ) then
               socket.close()
               break
            end
          end

           @socket_pairs.delete( websocket )

        end

        return socket

      end


      #--------------------------------
      # On Socket Open
      websocket.onopen do

        puts( "Onopen: " )   if( @debug_mode )

      end
      
      #--------------------------------
      # On Socket Close
      websocket.onclose do

        receive_thread = @receive_threads[ websocket ]
        if( receive_thread ) then
          Thread.kill( @receive_threads[ websocket ] )
        end

        normal_socket = @socket_pairs[ websocket ]
        if( normal_socket ) then
          normal_socket.puts( "QUIT" )
          normal_socket.gets()
          @socket_pairs.delete( websocket )
        end
        

        puts( "Onclose: " )   if( @debug_mode )

      end
      
      #--------------------------------
      # On Message
      websocket.onmessage do |message|
        
        normal_socket = @socket_pairs[ websocket ]

        puts( "Onmessage: " + message )   if( @debug_mode )
        
        command_arguments = message.split(";")

        case( command_arguments[0] )
          
        when "login"
          
          normal_socket = @socket_pairs[ websocket ] ||  create_new_socket( websocket )            
          normal_socket.puts( "0.1.1 beta" )
          normal_socket.puts( command_arguments[1] )
          #normal_socket.puts( "CLIENTTYPE" + create_element( "clienttype" , "webbrowser") )
          #normal_socket.puts( "LOGINNAME" + create_element( "loginname" , command_arguments[1]) )
        
        else

          normal_socket.puts( message )
        end


      end

    end

  end
    
  #----------------------------------------------------------------
  # Create Element
  private
  def create_element( name , value )
    return DELIMITER + name + DELIMITER + value + DELIMITER + name + DELIMITER
  end
  
  #---------------------------------------------------------------- 
  # Read Element
  private
  def read_element( string , name )
    return string.split( "$#{name}$" )[1] || ""
  end
    
end
