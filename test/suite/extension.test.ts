import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  test('Configuration object available and returns strings', async () => {
    const cfg = vscode.workspace.getConfiguration('vibecaas');
    assert.ok(cfg, 'Configuration not found');
    const url = cfg.get<string>('ollamaUrl', 'http://localhost:11434');
    const model = cfg.get<string>('defaultModel', 'qwen2.5-coder:7b');
    assert.strictEqual(typeof url, 'string');
    assert.strictEqual(typeof model, 'string');
  });
});

