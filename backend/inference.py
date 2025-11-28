
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
	# Tokenize input
	input_ids = tokenizer.encode(prompt)
	input_tensor = torch.tensor(input_ids, dtype=torch.long).unsqueeze(1).to(device)
	with torch.no_grad():
		output_ids = model.generate(input_tensor, tokenizer)
	return tokenizer.decode(output_ids)
