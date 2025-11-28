import torch
from torch.utils.data import Dataset, DataLoader
from tokenizer import SimpleTokenizer
from model import TinyTransformer

class MathDataset(Dataset):
    def __init__(self, path, tok):
        self.lines = open(path).read().splitlines()
        self.tok = tok

    def __len__(self):
        return len(self.lines)

    def __getitem__(self, idx):
        line = self.lines[idx]
        ids = self.tok.encode(line)
        return torch.tensor(ids[:-1]), torch.tensor(ids[1:])


def collate_fn(batch):
    xs, ys = zip(*batch)

    max_len = max(len(x) for x in xs)

    padded_x = [torch.nn.functional.pad(x, (0, max_len - len(x))) for x in xs]
    padded_y = [torch.nn.functional.pad(y, (0, max_len - len(y))) for y in ys]

    return torch.stack(padded_x), torch.stack(padded_y)


tok = SimpleTokenizer()
dataset = MathDataset("dataset/train.txt", tok)
loader = DataLoader(dataset, batch_size=16, shuffle=True, collate_fn=collate_fn)

model = TinyTransformer(vocab_size=len(tok.chars))
optimizer = torch.optim.Adam(model.parameters(), lr=3e-4)

for epoch in range(10):
    for x, y in loader:
        logits = model(x)
        loss = torch.nn.functional.cross_entropy(
            logits.view(-1, logits.size(-1)),
            y.view(-1)
        )

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    print(f"Epoch {epoch} Loss: {loss.item()}")

torch.save(model.state_dict(), "checkpoints/model.pt")
print("Training complete!")
