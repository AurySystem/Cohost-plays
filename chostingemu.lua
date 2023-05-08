
function init()
	savestate.loadslot(0,true)
	emu.yield()
	client.pause()
end
init()
while true do
	
	local file = io.open("./test.txt")
	if file ~= nil then 
		local raw = file:read()
		-- print(raw)
		local inputs = {}
		if raw ~= nil then
			if string.len(raw) > 0 then
				for input in string.gmatch(raw, "[^%s]") do
					if input ~= "nil" then
						inputs[input] = true
					end
			    end
		    end
		end
	    
		file:close()
		
		local test = os.remove("./test.txt")
		console.log(test)
		
		client.unpause()
	    joypad.set(inputs)
		emu.frameadvance()
		emu.yield()
		client.pause()
		savestate.saveslot(0)
		client.screenshot("screenshot.png")
	end
end