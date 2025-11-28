
import torch
import torch.nn as nn

class TinyTransformer(nn.Module):
	def __init__(self, vocab_size, emb_size=32, nhead=2, nhid=64, nlayers=2, max_len=32):
		super().__init__()
		self.embedding = nn.Embedding(vocab_size, emb_size)
		self.pos_embedding = nn.Embedding(max_len, emb_size)
		encoder_layer = nn.TransformerEncoderLayer(emb_size, nhead, nhid)
		self.transformer = nn.TransformerEncoder(encoder_layer, nlayers)
		self.fc_out = nn.Linear(emb_size, vocab_size)
		self.max_len = max_len

	def forward(self, src):
		seq_len = src.size(0)
		pos = torch.arange(0, seq_len, device=src.device).unsqueeze(1)
		x = self.embedding(src) + self.pos_embedding(pos)
		x = self.transformer(x)
		logits = self.fc_out(x)
		return logits

	def generate(self, input_tensor, tokenizer, max_new_tokens=8):
		generated = input_tensor.clone()
		for _ in range(max_new_tokens):
			logits = self.forward(generated)
			next_token_logits = logits[-1, 0]
			next_token = torch.argmax(next_token_logits).unsqueeze(0).unsqueeze(1)
			generated = torch.cat([generated, next_token], dim=0)
			if next_token.item() == tokenizer.eos_token_id:
				break
		return generated.squeeze(1).tolist()
