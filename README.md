# CheapSeek Native

CheapSeek Native is a VS Code extension that connects your editor to a locally running LLM through a host-installed Ollama server.

The default model is currently `deepseek-r1:7b`.

The goal of CheapSeek is to turn VS Code into a lightweight local code assistant that can inspect the current file, selected code, and eventually the whole workspace without sending your code to a cloud API.

CheapSeek Native is the host-based version of the project. It expects Ollama to be installed and running directly on your machine.

A separate containerized version, **CheapSeek Containerized**, is planned for running Ollama inside Docker while still exposing the Ollama API to the extension.

---

## Current Features

* Ask a local LLM about the current open file
* Send file contents to a local Ollama model
* Display responses in a VS Code output panel
* Configure the Ollama endpoint
* Configure the model name
* Configure the maximum number of characters sent per file

---

## Planned Features

* Ask about selected code
* Ask about the current workspace
* Choose model size based on available hardware
* Add model profiles such as `1.5B`, `7B`, `14B`, and `32B`
* Add chunking for larger workspaces
* Add a webview chat/dashboard
* Optional diagnostics for AI-generated code review findings

---

## Requirements

CheapSeek Native requires Ollama to be installed and running locally on your host machine.

### 1. Install Ollama

Install Ollama from:

  ```text
  https://ollama.com
  ```

### 2. Start Ollama

  ```bash
  ollama serve
  ```

If Ollama is already running, you may see:

  ```text
  Error: listen tcp 127.0.0.1:11434: bind: address already in use
  ```

That is okay. It means the Ollama server is already active.

### 3. Pull a supported model

`deepseek-r1` is the recommended model line for this project.

  ```bash
  ollama pull deepseek-r1:7b
  ```

Other supported examples include:

  ```bash
  ollama pull deepseek-r1:1.5b
  ollama pull deepseek-r1:14b
  ollama pull deepseek-r1:32b
  ```

### 4. Check installed models

  ```bash
  ollama list
  ```

If DeepSeek was installed successfully, you should see output similar to:

  ```text
  NAME              ID              SIZE      MODIFIED
  deepseek-r1:7b    755ced02ce7b    4.7 GB    5 seconds ago
  ```

The exact `ID`, `SIZE`, and `MODIFIED` values may differ on your machine. The important part is that the `NAME` column includes:

  ```text
  deepseek-r1:7b
  ```
(or whichever model you chose)

---

## Default Model

CheapSeek Native currently defaults to:

  ```text
  deepseek-r1:7b
  ```

Default endpoint:

  ```text
  http://localhost:11434/api/chat
  ```

You can change both values in VS Code settings.

---

## Extension Settings

CheapSeek contributes the following settings:

```json
{
  "cheapseek.modelEndpoint": "http://localhost:11434/api/chat",
  "cheapseek.modelName": "deepseek-r1:7b",
  "cheapseek.maxCharsPerFile": 12000
}
```

### `cheapseek.modelEndpoint`

The local Ollama chat API endpoint.

Default:

  ```text
  http://localhost:11434/api/chat
  ```

### `cheapseek.modelName`

The Ollama model CheapSeek should use.

Default:

  ```text
  deepseek-r1:7b
  ```

Example values:

  ```text
  deepseek-r1:1.5b
  deepseek-r1:7b
  deepseek-r1:14b
  deepseek-r1:32b
  ```

If you are unsure which model to run, start with `deepseek-r1:1.5b` and work your way up based on your machine's performance. A breif hardware guide is included in the next section

### `cheapseek.maxCharsPerFile`

The maximum number of characters CheapSeek sends from the current file to the local model.

Default:

  ```text
  12000
  ```

This helps avoid oversized prompts and keeps responses faster.

---

## Hardware Guide

Local model performance depends heavily on available RAM, VRAM, CPU, and whether the model is running on GPU or CPU.

These are rough guidelines, not strict requirements.

### `deepseek-r1:1.5b`

Recommended RAM:

  ```text
  8 GB+
  ```

Best for:

```text
Low-end laptops, quick questions, and small files
```

Notes:

```text
Fastest option, but weaker reasoning.
```

### `deepseek-r1:7b`

Recommended RAM:

```text
16 GB+
```

Best for:

```text
General local coding help, current-file questions, and selected-code explanations
```

Notes:

```text
Good balance of speed and quality.
```

### `deepseek-r1:14b`

Recommended RAM:

```text
32 GB+
```

Best for:

```text
Deeper code review, larger files, and better reasoning
```

Notes:

```text
Slower than 7B and may feel heavy on laptops.
```

### `deepseek-r1:32b`

Recommended RAM:

```text
64 GB+
```

Best for:

```text
Stronger local reasoning and more complex workspace analysis
```

Notes:

```text
Much slower without a strong GPU.
```

CheapSeek was built with the `deepseek-r1` model line in mind, but it can run with other Ollama-compatible models.

---

## Commands

CheapSeek currently provides the following commands:

```text
CheapSeek: Ask About Current File
CheapSeek: Clear Output
```

Planned commands:

```text
CheapSeek: Ask About Selection
CheapSeek: Ask About Workspace
CheapSeek: Choose Local Model
CheapSeek: Review Current File
CheapSeek: Review Workspace
```

---

## Development

### 1. Install dependencies

```bash
npm install
```

### 2. Compile

```bash
npm run compile
```

### 3. Watch mode

```bash
npm run watch
```

### 4. Run the extension

Open this project in VS Code.

Then:

1. Open the **Run and Debug** panel.
2. Select **Run Extension**.
3. Press the green play button.

This opens a new **Extension Development Host** window.

### 5. Run a CheapSeek command

In the Extension Development Host window, run:

```text
CheapSeek: Ask About Current File
```

---

## Project Structure

Current structure:

```text
src/
  extension.ts
```

Planned structure:

```text
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
```

---

## Architecture

CheapSeek is designed around a simple pipeline:

```text
VS Code command
  -> collect file or selection context
  -> build prompt
  -> send request to local Ollama model
  -> show answer in VS Code
```

The long-term architecture is split into five layers:

### Command Layer

Determines what the user asked CheapSeek to do.

Examples:

```text
Ask about current file
Ask about selected code
Ask about workspace
Review current file
```

### Document Layer

Determines which files, selections, or workspace content should be included.

### Context Layer

Controls how much code should be sent to the model and how that code should be formatted.

### Agent Layer

Handles communication with the local LLM through the Ollama API.

### UI Layer

Controls how answers are displayed inside VS Code.

---

## Local-First Goal

CheapSeek Native is intended to keep source code local.

The extension sends code context only to the configured local endpoint. By default, this is Ollama running on:

```text
localhost:11434
```

No cloud API is required for the default setup.

---

## CheapSeek Native vs CheapSeek Containerized

CheapSeek is planned to have two local-first deployment options:

### CheapSeek Native

Runs against an Ollama server installed directly on the host machine.

This version is best if you already use Ollama locally or want full control over your Ollama installation.

### CheapSeek Containerized

Runs against an Ollama server inside a Docker container.

This version is intended to make setup more portable and reproducible while still keeping the model runtime local.

Both versions communicate with Ollama through the Ollama API.

---

## Notes

This project started as a simple TODO/FIXME scanner to learn how VS Code extensions interact with file data, diagnostics, and output panels.

That scanner served as a precursor project. CheapSeek now uses the same file-reading scaffolding to power a local LLM code assistant.
