class Games
  
  require "17"

  #----------------------------------------------------------------------------
  def start( game , socket )

    case game
    when "17"
      title("1 7  ‚")
      Play17.new.play(socket,"17")
    when "16"
      title("1 6  ‚")
      Play17.new.play(socket,"16")
    end
  end
  #----------------------------------------------------------------------------
  def title( name )

    9.times do
      STDOUT.puts
    end
    STDOUT.puts "#"*80      
    STDOUT.puts "#"+ " "*78 +"#"
    STDOUT.puts "#"+ name.center(78) +"#"
    STDOUT.puts "#"+ " "*78 +"#"
    STDOUT.puts "#"*80
    10.times do
      STDOUT.puts
    end
    
  end
  #----------------------------------------------------------------------------
end
