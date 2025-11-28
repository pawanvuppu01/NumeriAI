import torch
from model import TinyTransformer
from tokenizer import SimpleTokenizer

tok = SimpleTokenizer()
model = TinyTransformer(vocab_size=len(tok.chars))
model.load_state_dict(torch.load("checkpoints/model.pt", map_location="cpu"))
model.eval()

def generate_answer(prompt, max_new_tokens=2):
    tokens = tok.encode(prompt)
    x = torch.tensor(tokens).unsqueeze(0)

    for _ in range(max_new_tokens):
        logits = model(x)
        next_id = int(logits[0, -1].argmax())
        x = torch.cat([x, torch.tensor([[next_id]])], dim=1)

    return tok.decode(x[0].tolist())
