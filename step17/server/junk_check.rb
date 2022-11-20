module MahjongCheck

  YAOCHU = [0,8,9,17,18,26,27,28,29,30,31,32,33]

  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def search_yaku(hand_given)

    hand = hand_given.sort

    yaku = []

    if( hand.uniq == YAOCHU ) then
      return ["kokushi"]
    end

    if( Array.new(7){|i| hand[i*2]}.uniq == Array.new(7){|i| hand[i*2+1]} )
      yaku.push("chitoi")
    end

    if( ( hand & YOCHU ).size == 0 ) then
      yaku.push("tanyao")
    end

    if( ( hand - YOCHU ).size == 0 ) then
      yaku.push("honrou")
    end

    return yaku

  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def check_finish(hand_given)
    
    hand = hand_given.sort
    
    # Check Thirteen orphans
    
    if(hand.uniq == YAOCHU)
      return true
    end
    
    # Check Seven pairs
    
    if(Array.new(7){|i| hand[i*2]}.uniq == Array.new(7){|i| hand[i*2+1]})
      return true
    end
    
    # Check normal hand
    
    head = 0
    
    while (head <= 12)
      
      nhead = hand.select{|i| i == hand[head]}.size
      
      if (nhead == 1)
        head += 1
        next
      end
      
      testhand = Array.new(hand)
      testhand.delete_at(head)
      testhand.delete_at(head)
      
      menz = []
      
      while ( true )
        
        if (testhand.empty?)
          return true
        end
        
        search = testhand[0]
        
        #print "Check %s -> " % TILES[search]
        #print_hand(testhand,menz)
        
        if (testhand[2] == search)
          menz.push(testhand.slice!(0..2))
          redo
        end
        
        if (search < 27)&&(search%9 < 7)
          p1 = testhand.index(search+1)
          p2 = testhand.index(search+2)
          
          if ( (p1 != nil)&&(p2 != nil) )
            menz.push([search,search+1,search+2])
            testhand.delete_at(p2)
            testhand.delete_at(p1)
            testhand.delete_at(0)
            redo
          end
        end
        
        if (testhand.index(search) != nil)
          break
        end
        
      end
      
      head += nhead
      
    end
    
    return false
    
  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def search_wait(hand)
    
    wait = []
    
    for i in 0..33
      if(check_finish(hand + [i]))
        wait.push(i)
      end
    end
    
    return wait
  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
end
