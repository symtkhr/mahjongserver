require "display"

class Play17
  
  def play(socket,type)
    
    require "make_hand"
    
    while true
      
      command = socket.gets.strip.split(';')
      head = command.shift
      
      case head
      when "void"
        #Do Nithing
        redo
        
      when "init"
        # Display Initial Message
        
        STDOUT.puts
        command.each do |message|
          STDOUT.puts message
        end
        STDOUT.puts
        
      when "message"
        # Simple message
        
        STDOUT.puts command.to_s
        
      when "make_hand"
        # Make Hand
        
        make_hand = MakeHand.new(command,type)
        socket.puts make_hand.make
 
      when "clear"
        
        24.times do
          STDOUT.puts
        end
        
      when "discard"
        # Display discards
        
        Display.discard( command.shift , command )
        
      when "hand"
        # Display hand
        
        Display.hand( command )
        
      when "discard_item"
        # Display discard_item
        
        nremain = command.size 
        Display.discard_item( command )
        
      when "turn"
        # discard a tile
        
        num = -1
        while !( 1 <= num&&num <= nremain )
          print "Your Turn> "
          num =  STDIN.gets.to_i
        end
        
        socket.puts num.to_s
        
      when "check"
        
        Display.check( command[0] , command[1].to_i )
        
        chk = ""
        while not( (chk == "y") or (chk == "n") )
          print "Finish? (y,n)> "
          chk = STDIN.gets.strip
        end
        
        socket.puts( chk == "y" ? "finish" : "void" )
        
      when "finish"
        
        Display.ron
        
      when "draw"
        
        STDOUT.puts
        STDOUT.puts "-"*36 + "D R A W "+ "-"*36
        STDOUT.puts
        
      when "final_hands"
        
        Display.final_hand( command )
        
      when "confirm"
        
        print "Press Enter>"
        socket.puts STDIN.gets
        
      when "continue"
        
        chk = ""
        while not( (chk == "y") or (chk == "n") )
          print "Continue? (y,n)> "
          chk = STDIN.gets.strip
        end
        socket.puts( chk == "y" ? "continue" : "exit" )
        
      when "quit"
        # Quit Game
        STDOUT.puts "Game Finish."
        break
        
      else
        # message Command Error
        STDOUT.puts "Unknown Command Was Detected."
      end
      
    end
    
  end
  
end
