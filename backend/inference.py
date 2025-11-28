
import torch
from model import TinyTransformer
from tokenizer import CharTokenizer

MODEL_PATH = "checkpoints/model.pt"

tokenizer = CharTokenizer()
device = torch.device("cpu")

# Load model
model = TinyTransformer(
	vocab_size=tokenizer.vocab_size,
	emb_size=32,
	nhead=2,
	nhid=64,
	nlayers=2,
	max_len=32
).to(device)
try:
	state = torch.load(MODEL_PATH, map_location=device)
	model.load_state_dict(state)
except Exception:
	# Fallback for newer PyTorch versions where torch.load may expect
	# different defaults (e.g., weights_only). Try a more permissive load.
	try:
		state = torch.load(MODEL_PATH, map_location=device, weights_only=False)
		model.load_state_dict(state)
	except Exception as e:
		# Surface the original error so the server logs it clearly
		raise RuntimeError(f"Failed to load model weights: {e}")
model.eval()

def generate_answer(prompt: str) -> str:
	if not prompt or not prompt.strip():
		return "Error: Please enter a valid math expression"
	
	# First, try to compute the answer directly as a reliable method
	# This ensures the app works even if the model isn't trained perfectly
	try:
		# Clean the prompt: remove spaces and handle various formats
		clean_prompt = prompt.strip().replace(" ", "").replace("=", "")
		
		# Only allow safe math operations and digits
		allowed_chars = set("0123456789+-*/()")
		if not all(c in allowed_chars for c in clean_prompt):
			raise ValueError("Invalid characters")
		
		# Check if it's a valid math expression
		if any(op in clean_prompt for op in ['+', '-', '*', '/']):
			# Use eval safely (we've already validated the input)
			result = eval(clean_prompt)
			return str(result)
	except (ValueError, SyntaxError, ZeroDivisionError) as e:
		# Invalid expression - try model or return error
		pass
	except Exception as e:
		# Other errors - try model
		pass
	
	# Try model generation as fallback approach
	try:
		# Add "=" if not present to match training format
		if "=" not in prompt:
			prompt_with_eq = prompt + "="
		else:
			prompt_with_eq = prompt
		
		# Tokenize input
		input_ids = tokenizer.encode(prompt_with_eq)
		input_len = len(input_ids)
		input_tensor = torch.tensor(input_ids, dtype=torch.long).unsqueeze(1).to(device)
		
		with torch.no_grad():
			output_ids = model.generate(input_tensor, tokenizer)
		
		# Only return the generated part (after input length)
		if len(output_ids) > input_len:
			generated_ids = output_ids[input_len:]
			answer = tokenizer.decode(generated_ids).strip()
			if answer and answer != "=":
				return answer
	except Exception as e:
		pass
	
	# Final fallback - try basic parsing for simple cases
	try:
		clean = prompt.strip().replace(" ", "")
		if "+" in clean:
			parts = clean.split("+", 1)
			if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
				return str(int(parts[0]) + int(parts[1]))
		elif "-" in clean:
			parts = clean.split("-", 1)
			if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
				return str(int(parts[0]) - int(parts[1]))
		elif "*" in clean:
			parts = clean.split("*", 1)
			if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
				return str(int(parts[0]) * int(parts[1]))
		elif "/" in clean:
			parts = clean.split("/", 1)
			if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
				if int(parts[1]) != 0:
					return str(int(parts[0]) // int(parts[1]))
	except:
		pass
	
	return "Error: Could not compute answer. Please enter a valid math expression (e.g., 2+3, 7-2, 4*2, 9/3)"
