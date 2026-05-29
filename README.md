# CheapSeek

CheapSeek is a VS Code extension that connects your editor to a locally running LLM through Ollama.

The goal is to turn VS Code into a lightweight local code assistant that can inspect the current file, selected code, and eventually the whole workspace without sending your code to a cloud API.

CheapSeek is built as a local-first experiment using models like DeepSeek R1 through Ollama.

## Current Features

- Ask a local LLM about the current open file
- Send file contents to a local Ollama model
- Display responses in a VS Code output panel
- Configurable Ollama endpoint
- Configurable model name
- Configurable max characters per file

## Planned Features

- Ask about selected code
- Ask about the current workspace
- Choose model size based on available hardware
- Add model profiles such as 1.5B, 7B, 14B, and 32B
- Add chunking for larger workspaces
- Add a webview chat/dashboard
- Optional diagnostics for AI-generated code review findings

## Requirements

CheapSeek requires Ollama to be installed and running locally.

Install Ollama:

```bash

https://ollama.com

Start Ollama:

ollama serve

If Ollama is already running, you may see:

Error: listen tcp 127.0.0.1:11434: bind: address already in use

That is okay. It means the Ollama server is already active.

Pull a supported model:

ollama pull deepseek-r1:7b

Check installed models:

ollama list

Default Model

CheapSeek currently defaults to:

deepseek-r1:7b

Default endpoint:

http://localhost:11434/api/chat

You can change these in VS Code settings.
Extension Settings

CheapSeek contributes the following settings:

{
  "cheapseek.modelEndpoint": "http://localhost:11434/api/chat",
  "cheapseek.modelName": "deepseek-r1:7b",
  "cheapseek.maxCharsPerFile": 12000
}

cheapseek.modelEndpoint

The local Ollama chat API endpoint.

Default:

http://localhost:11434/api/chat

cheapseek.modelName

The Ollama model CheapSeek should use.

Example values:

deepseek-r1:1.5b
deepseek-r1:7b
deepseek-r1:14b
deepseek-r1:32b

cheapseek.maxCharsPerFile

The maximum number of characters CheapSeek sends from the current file to the local model.

This helps avoid oversized prompts.
Commands

CheapSeek currently provides:

CheapSeek: Ask About Current File
CheapSeek: Clear Output

Planned commands:

CheapSeek: Ask About Selection
CheapSeek: Ask About Workspace
CheapSeek: Choose Local Model
CheapSeek: Review Current File
CheapSeek: Review Workspace

Development

Install dependencies:

npm install

Compile:

npm run compile

Watch mode:

npm run watch

Run the extension:

    Open this project in VS Code.

    Open the Run and Debug panel.

    Select Run Extension.

    Press the green play button.

This opens a new Extension Development Host window.

In that window, run:

CheapSeek: Ask About Current File

Project Structure

Current structure:

src/
  extension.ts

Planned structure:

src/
  extension.ts
  types.ts

  documents/
    getActiveDocument.ts
    getWorkspaceDocuments.ts
    createFilePayload.ts
    getSelectedText.ts

  context/
    buildCodeContext.ts

  agent/
    ollamaClient.ts
    prompts.ts
    modelProfiles.ts

  ui/
    output.ts
    quickPick.ts

Architecture

CheapSeek is designed around a simple pipeline:

VS Code command
→ collect file or selection context
→ build prompt
→ send request to local Ollama model
→ show answer in VS Code

The long-term architecture is:

Command layer:
  What did the user ask CheapSeek to do?

Document layer:
  What files, selections, or workspace content should be included?

Context layer:
  How much code should be sent to the model?

Agent layer:
  How does CheapSeek talk to the local LLM?

UI layer:
  How should the answer be displayed?

Local-First Goal

CheapSeek is intended to keep source code local.

The extension sends code context only to the configured local endpoint. By default, this is Ollama running on localhost.

No cloud API is required for the default setup.
Notes

This project started as a simple TODO/FIXME scanner to learn how VS Code extensions interact with file data, diagnostics, and output panels.

That scanner served as a precursor project. CheapSeek now focuses on using the same file-reading scaffolding to power a local LLM code assistant.
