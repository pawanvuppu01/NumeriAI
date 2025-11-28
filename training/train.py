
import torch
import torch.nn as nn
import torch.optim as optim
from model import TinyTransformer
from tokenizer import CharTokenizer

DATA_PATH = "dataset.txt"
MODEL_PATH = "../backend/checkpoints/model.pt"
device = torch.device("cpu")

def load_data(path, tokenizer):
	with open(path, "r") as f:
		lines = f.read().strip().split("\n")
	data = []
	for line in lines:
		ids = tokenizer.encode(line)
		data.append(torch.tensor(ids, dtype=torch.long))
	return data

def collate_batch(batch):
	# Pad sequences to max length in batch
	max_len = max([x.size(0) for x in batch])
	padded = []
	for x in batch:
		pad = torch.full((max_len - x.size(0),), tokenizer.vocab[" "], dtype=torch.long)
		padded.append(torch.cat([x, pad]))
	return torch.stack(padded).t()  # (seq_len, batch_size)

tokenizer = CharTokenizer()
data = load_data(DATA_PATH, tokenizer)
batch = collate_batch(data)

model = TinyTransformer(
	vocab_size=tokenizer.vocab_size,
	emb_size=32,
	nhead=2,
	nhid=64,
	nlayers=2,
	max_len=32
).to(device)

optimizer = optim.Adam(model.parameters(), lr=0.01)
criterion = nn.CrossEntropyLoss()

for epoch in range(300):
	optimizer.zero_grad()
	output = model(batch[:-1, :])
	loss = criterion(
		output.view(-1, tokenizer.vocab_size),
		batch[1:, :].reshape(-1)
	)
	loss.backward()
	optimizer.step()
	if (epoch + 1) % 50 == 0:
		print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}")

torch.save(model.state_dict(), MODEL_PATH)
print(f"Model saved to {MODEL_PATH}")
