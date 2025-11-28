
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from model import TinyTransformer
from tokenizer import CharTokenizer
import random

DATA_PATH = "dataset.txt"
MODEL_PATH = "../backend/checkpoints/model.pt"
device = torch.device("cpu")
BATCH_SIZE = 32
NUM_EPOCHS = 500

class MathDataset(Dataset):
	def __init__(self, data_path, tokenizer):
		with open(data_path, "r") as f:
			lines = f.read().strip().split("\n")
		self.data = []
		for line in lines:
			ids = tokenizer.encode(line)
			self.data.append(torch.tensor(ids, dtype=torch.long))
	
	def __len__(self):
		return len(self.data)
	
	def __getitem__(self, idx):
		return self.data[idx]

def collate_batch(batch):
	# Pad sequences to max length in batch
	max_len = max([x.size(0) for x in batch])
	padded = []
	for x in batch:
		pad = torch.full((max_len - x.size(0),), tokenizer.vocab[" "], dtype=torch.long)
		padded.append(torch.cat([x, pad]))
	return torch.stack(padded).t()  # (seq_len, batch_size)

tokenizer = CharTokenizer()
dataset = MathDataset(DATA_PATH, tokenizer)
dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True, collate_fn=collate_batch)

model = TinyTransformer(
	vocab_size=tokenizer.vocab_size,
	emb_size=32,
	nhead=2,
	nhid=64,
	nlayers=2,
	max_len=32
).to(device)

optimizer = optim.Adam(model.parameters(), lr=0.001)  # Lower learning rate for better convergence
criterion = nn.CrossEntropyLoss(ignore_index=tokenizer.vocab[" "])  # Ignore padding tokens

print(f"Training on {len(dataset)} examples")
print(f"Batch size: {BATCH_SIZE}, Epochs: {NUM_EPOCHS}")
print("Starting training...")

for epoch in range(NUM_EPOCHS):
	total_loss = 0
	num_batches = 0
	
	for batch in dataloader:
		optimizer.zero_grad()
		
		# Input is all tokens except last, target is all tokens except first
		input_seq = batch[:-1, :]
		target_seq = batch[1:, :]
		
		output = model(input_seq)
		loss = criterion(
			output.view(-1, tokenizer.vocab_size),
			target_seq.reshape(-1)
		)
		loss.backward()
		optimizer.step()
		
		total_loss += loss.item()
		num_batches += 1
	
	avg_loss = total_loss / num_batches if num_batches > 0 else 0
	
	if (epoch + 1) % 50 == 0:
		print(f"Epoch {epoch+1}/{NUM_EPOCHS}, Loss: {avg_loss:.4f}")

torch.save(model.state_dict(), MODEL_PATH)
print(f"\nModel saved to {MODEL_PATH}")
print("Training complete!")
