import sys
from pathlib import Path
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

# Add project root to sys.path to enable direct execution
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

class SatelliteCNNFeatureExtractor(nn.Module):
    """
    CNN architecture designed to extract spatial feature embeddings from satellite image tiles (3 x 64 x 64).
    Returns a 64-dimensional spatial embedding vector.
    """
    def __init__(self, out_dim=64):
        super(SatelliteCNNFeatureExtractor, self).__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(3, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.MaxPool2d(2, 2), # 32x32
            
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2, 2), # 16x16
            
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1)) # 64x1x1
        )
        self.fc = nn.Linear(64, out_dim)

    def forward(self, x):
        # x shape: (B, 3, 64, 64)
        feat = self.conv(x)
        feat = feat.view(feat.size(0), -1)
        return self.fc(feat)


class TemporalTransformerModule(nn.Module):
    """
    Transformer Encoder architecture for multi-step temporal sequence analysis (e.g. 7-day or 30-day environmental readings).
    """
    def __init__(self, input_dim=14, embed_dim=64, num_heads=4, num_layers=2):
        super(TemporalTransformerModule, self).__init__()
        self.input_proj = nn.Linear(input_dim, embed_dim)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim, nhead=num_heads, dim_feedforward=128, batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.out_proj = nn.Linear(embed_dim, embed_dim)

    def forward(self, seq_x):
        # seq_x shape: (B, seq_len, input_dim)
        proj = self.input_proj(seq_x)
        trans_out = self.transformer(proj)
        # Pooling across sequence dimension
        pooled = torch.mean(trans_out, dim=1)
        return self.out_proj(pooled)


class EarthGuardianHybridModel(nn.Module):
    """
    Hybrid Deep Learning Architecture combining:
    - Tabular Dense Feature Layer
    - Temporal Transformer Encoder Layer
    - Optional Satellite CNN Spatial Extractor Layer
    - Deep Fusion Classifier for LOW (0), MEDIUM (1), HIGH (2) multi-hazard risk.
    """
    def __init__(self, tabular_dim=14, num_classes=3):
        super(EarthGuardianHybridModel, self).__init__()
        self.tabular_net = nn.Sequential(
            nn.Linear(tabular_dim, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 64),
            nn.ReLU()
        )
        
        self.temporal_transformer = TemporalTransformerModule(input_dim=tabular_dim, embed_dim=64)
        self.cnn_extractor = SatelliteCNNFeatureExtractor(out_dim=64)
        
        # Fusion Classifier combining tabular (64) + temporal (64) + spatial (64 if img present, else 0)
        self.fusion_classifier = nn.Sequential(
            nn.Linear(64 + 64 + 64, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, num_classes)
        )
        
        self.tabular_only_classifier = nn.Sequential(
            nn.Linear(64 + 64, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, num_classes)
        )

    def forward(self, x_tab, seq_x=None, img_x=None):
        # x_tab shape: (B, tabular_dim)
        tab_feat = self.tabular_net(x_tab)
        
        if seq_x is None:
            # Create synthetic pseudo sequence from static tabular feature if sequence not supplied
            seq_x = x_tab.unsqueeze(1).repeat(1, 5, 1) # (B, 5, tabular_dim)
            
        temp_feat = self.temporal_transformer(seq_x)
        
        if img_x is not None:
            spatial_feat = self.cnn_extractor(img_x)
            fused = torch.cat([tab_feat, temp_feat, spatial_feat], dim=1)
            logits = self.fusion_classifier(fused)
        else:
            fused = torch.cat([tab_feat, temp_feat], dim=1)
            logits = self.tabular_only_classifier(fused)
            
        return logits

def train_hybrid_pytorch_model(X_train, y_train, X_val, y_val, epochs=25, batch_size=32):
    model = EarthGuardianHybridModel(tabular_dim=X_train.shape[1], num_classes=3)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=0.001, weight_decay=1e-4)
    
    X_train_t = torch.tensor(X_train, dtype=torch.float32)
    y_train_t = torch.tensor(y_train, dtype=torch.long)
    X_val_t = torch.tensor(X_val, dtype=torch.float32)
    y_val_t = torch.tensor(y_val, dtype=torch.long)
    
    dataset = torch.utils.data.TensorDataset(X_train_t, y_train_t)
    loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    history = {'train_loss': [], 'val_loss': [], 'val_acc': []}
    
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        for b_x, b_y in loader:
            optimizer.zero_grad()
            out = model(b_x)
            loss = criterion(out, b_y)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * b_x.size(0)
            
        train_loss = running_loss / len(X_train)
        
        model.eval()
        with torch.no_grad():
            val_out = model(X_val_t)
            val_loss = criterion(val_out, y_val_t).item()
            preds = torch.argmax(val_out, dim=1)
            val_acc = (preds == y_val_t).float().mean().item()
            
        history['train_loss'].append(round(train_loss, 4))
        history['val_loss'].append(round(val_loss, 4))
        history['val_acc'].append(round(val_acc, 4))

    return model, history


if __name__ == "__main__":
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print("=" * 60)
    print("EarthGuardian AI - Testing Deep Learning Hybrid PyTorch Model")
    print("=" * 60)
    from backend.ml.dataset_pipeline import DatasetPipeline
    
    pipeline = DatasetPipeline()
    X_train, y_train, X_val, y_val, X_test, y_test, stats = pipeline.get_train_test_splits()
    
    print("[1] Initializing Hybrid PyTorch Transformer Model...")
    model, history = train_hybrid_pytorch_model(X_train, y_train, X_val, y_val, epochs=5, batch_size=32)
    print(f"[2] Trained for 5 test epochs. Final Train Loss: {history['train_loss'][-1]}, Val Acc: {history['val_acc'][-1] * 100:.2f}%")
    
    # Test forward pass with image tensor
    dummy_img = torch.randn(2, 3, 64, 64)
    dummy_tab = torch.randn(2, 14)
    dummy_seq = torch.randn(2, 7, 14)
    out = model(dummy_tab, seq_x=dummy_seq, img_x=dummy_img)
    print(f"[3] Multi-modal forward pass output shape: {out.shape} (Batch: 2, Classes: 3)")
    print("=" * 60)
    print("Deep learning model execution completed successfully without errors!")
    print("=" * 60)
