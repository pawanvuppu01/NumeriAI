
import string

class CharTokenizer:
	def __init__(self):
		chars = string.digits + "+-*/= "
		self.chars = sorted(set(chars))
		self.vocab = {ch: i for i, ch in enumerate(self.chars)}
		self.inv_vocab = {i: ch for ch, i in self.vocab.items()}
		self.eos_token = "<EOS>"
		self.vocab[self.eos_token] = len(self.vocab)
		self.inv_vocab[len(self.inv_vocab)] = self.eos_token
		self.eos_token_id = self.vocab[self.eos_token]
		self.vocab_size = len(self.vocab)

	def encode(self, text):
		ids = [self.vocab.get(ch, self.vocab[" "]) for ch in text]
		ids.append(self.eos_token_id)
		return ids

	def decode(self, ids):
		chars = []
		for i in ids:
			ch = self.inv_vocab.get(i, "")
			if ch == self.eos_token:
				break
			chars.append(ch)
		return "".join(chars)
