
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
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()

def generate_answer(prompt: str) -> str:
	# Tokenize input
	input_ids = tokenizer.encode(prompt)
	input_tensor = torch.tensor(input_ids, dtype=torch.long).unsqueeze(1).to(device)
	with torch.no_grad():
		output_ids = model.generate(input_tensor, tokenizer)
	return tokenizer.decode(output_ids)
