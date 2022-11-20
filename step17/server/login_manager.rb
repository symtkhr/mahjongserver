# -*- coding: euc-jp -*-
class LoginManager

  require "games"

  #----------------------------------------------------------------------------
  def initialize

    @games = Games.new

    @sockets = Hash.new
    @threads = Hash.new

    @game_list = [["17_2" , "17steps 2P"       ,2,[]], \
                  ["17_3" , "17steps 3P"       ,3,[]], \
                  ["16"   , "16steps (const.)" ,3,[]], \
#                  ["4p"   , "四人打ち (工事中)" ,4,[]]
]

  end
  #----------------------------------------------------------------------------
  def add_user( name , socket )

    return false   if( @sockets[ name ] )
    return false   if( @games.is_playing( name ) )

    broadcast( "login;" + name )

    @sockets[ name ] = socket
    
    return true

  end
  #----------------------------------------------------------------------------
  def delete_user( name )

    @sockets[ name ].close
    @sockets.delete( name )

    reset_ready( name )

    broadcast( "logout;" + name )
    
  end
  #----------------------------------------------------------------------------
  def message_to( name , message )

    @sockets[ name ].puts( message )

  end
  #----------------------------------------------------------------------------
  def listen_to( name )

    return   @sockets[ name ].gets.strip

  end
  #----------------------------------------------------------------------------
  def broadcast( message )

    @sockets.each_key do |name|
      message_to( name , message )
    end

  end
  #----------------------------------------------------------------------------
  def reset_ready( name )

    @game_list.each do |game|
      game[3].delete( name )
    end

  end
  #----------------------------------------------------------------------------
  def wait( name )

    thread = Thread.new( name ) do |name|

      send_state( name )

      loop do
        
        begin
          command = @sockets[ name ].gets.strip.split(" ")
        rescue
          break
        end

        case command.shift
        when "who"
          message_to( name , "logins;" + members.join(DIV) )
        when "state"
          send_state( name )
        when "ready" ,"r"
          command.collect{|i| i.to_i}.each do |i|
            @game_list[i-1][3].push( name ).uniq!
          end
          send_state( name )
        when "reset"
          reset_ready( name )
          send_state( name )
        when "chat"
          broadcast( "chat;#{name};" + command.join(" ") )
        when "quit","q"
          message_to( name , "quit" )
          break
        else
          message_to( name , "unknown" )      
        end
        
      end

      delete_user( name )

    end

    @threads[ name ] = thread

  end
  #----------------------------------------------------------------------------
  def send_state( name )

    index = 1

    @game_list.each do |game|
      message_to( name , "state;#{index.to_i};" + game.flatten.join(DIV) )
      index += 1
    end

  end
  #----------------------------------------------------------------------------
  def start_game

    log

    @game_list.each do |game_state|
      
      game = game_state[0]
      nplayer = game_state[2]
      ready = game_state[3]
      
      redo if( check( ready ) )
      next if( ready.size < nplayer )

      players = Hash.new
      ready.each do |name|
        Thread.kill( @threads[ name ] )
        players[ name ] = @sockets.delete( name )
        break    if( players.size == nplayer )
      end
      
      players.each_key do |name|
        reset_ready( name )
      end
      
      Thread.new( game , players ) do |game,players|
        remains = @games.start( game , players )
        @sockets.update( remains )
        remains.each_key do |name|
          wait( name )
        end
      end
      
      
    end
  end
  #----------------------------------------------------------------------------
  def check( list = @name )

    deleted = false
    list.each do |name|
      begin
        @sockets[ name ].puts( "void" )
      rescue
        delete_user( name )
        deleted = true
      end
    end

    return deleted

  end
  #----------------------------------------------------------------------------
  def members

    return @sockets.keys
    
  end
  #----------------------------------------------------------------------------
  def log
    
    strings = [""]
    strings.push( "Login:  #{members.join(", ")}" )
    strings.push( "Ready:  #{@game_list.transpose[3].join(", ")}" )
    strings.push( "Play :  #{@games.playing.flatten.join(", ")}" )
    
    system( "echo > state.dat" )
    strings.each do |string|
      system( "echo #{string} >> state.dat" )
    end
    
  end
  #----------------------------------------------------------------------------
end
