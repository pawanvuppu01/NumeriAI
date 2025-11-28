import torch
import torch.nn as nn

class TinyTransformer(nn.Module):
    def __init__(self, vocab_size, dim=64, n_heads=4, n_layers=2):
        super().__init__()

        self.embedding = nn.Embedding(vocab_size, dim)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=dim,
            nhead=n_heads,
            dim_feedforward=256     # THIS MATCHES YOUR TRAINED MODEL
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=n_layers)
        self.fc = nn.Linear(dim, vocab_size)

    def forward(self, x):
        x = self.embedding(x).transpose(0, 1)
        x = self.transformer(x).transpose(0, 1)
        return self.fc(x)
