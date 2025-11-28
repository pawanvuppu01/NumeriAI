import string

class SimpleTokenizer:
    def __init__(self):
        self.chars = string.digits + "+-*/= "
        self.stoi = {ch: i for i, ch in enumerate(self.chars)}
        self.itos = {i: ch for i, ch in enumerate(self.chars)}

    def encode(self, text):
        return [self.stoi[ch] for ch in text if ch in self.stoi]

    def decode(self, tokens):
        return "".join(self.itos[t] for t in tokens)
