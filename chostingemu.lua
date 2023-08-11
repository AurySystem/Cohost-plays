
function init()
	savestate.loadslot(10,true)
	emu.yield()
end
init()

inputBridge = {}

setInputsForFrame = function() 
	joypad.set(inputBridge)
end

event.onframestart(setInputsForFrame)

while true do
	
	local file = io.open("./test.txt")
	if file ~= nil then 
		
		local raw = file:read()
		-- print(raw)
		local inputs = {}
		if raw ~= nil then
			if string.len(raw) > 0 then
				for input in string.gmatch(raw, "([^%s]+)") do
					if input ~= "nil" and input ~= "" then
						inputs[input] = "True"
					end
			    end
		    end
		end
	    
		file:close()
		
		local test = os.remove("./test.txt")
		console.log(test)
		console.log(inputs)
		
		inputBridge = inputs
		savestate.loadslot(10,true)
		
		joypad.set(inputBridge) --spam just encase it doesn't poll it
		joypad.set(inputBridge)
		emu.frameadvance()
		joypad.set(inputBridge)
		inputBridge = {};
		savestate.save("transCopy")
		savestate.saveslot(10)
		client.screenshot("screenshot.png")
	end
	emu.yield()
end
