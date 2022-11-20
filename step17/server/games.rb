class Games
  
  #----------------------------------------------------------------------------

  require "17"

  #----------------------------------------------------------------------------
  def initialize
    
    @playing_list = Array.new
    
  end
  #----------------------------------------------------------------------------
  def playing
    
    return   @playing_list
    
  end
  #----------------------------------------------------------------------------
  def is_playing( name )
    
    return   @playing_list.flatten.index( name )
    
  end
  #----------------------------------------------------------------------------
  def start( game_type , sockets )

    name_list = sockets.keys.sort
    @playing_list.push( name_list )

    case game_type
    when "17_2" ,"17_3"
      Game17.new.play( sockets , "17" )
    when "16"
      Game17.new.play( sockets , "16" )
    end

    @playing_list.delete( name_list )

    return sockets

  end
  #----------------------------------------------------------------------------
end
