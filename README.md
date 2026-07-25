# CheapSeek Native

CheapSeek Native is a VS Code extension that connects your editor to a locally running LLM through a host-installed Ollama server.

The default model is currently `deepseek-r1:7b`, but CheapSeek can now detect locally installed Ollama models and switch between them from the chat panel.

The goal of CheapSeek is to turn VS Code into a lightweight local code assistant that can inspect the current file, workspace context, and prior chat history without sending your code to a cloud API.

CheapSeek Native is the host-based version of the project. It expects Ollama to be installed and running directly on your machine.

A separate containerized version, **CheapSeek Containerized**, is planned for running Ollama inside Docker while still exposing the Ollama API to the extension.

---

## Current Features

* Ask a local LLM about the current open file
* Ask a local LLM about the current workspace
* Switch between **Current File** and **Workspace** context from the webview
* Send bounded file or workspace context to a local Ollama model
* Display responses in a VS Code webview chat panel
* Display responses in a VS Code output panel for command-palette current-file questions
* Persistent chat history per workspace
* Multiple chat sessions so users can start fresh when context grows too large
* Switch between saved chat sessions
* Refresh current editor/workspace context
* Refresh chat history
* Detect installed Ollama models through the local Ollama API
* Switch between installed Ollama models from the chat panel
* Store the selected model in VS Code workspace settings
* Show model details such as size, family, parameter size, and quantization level when available
* Prevent duplicate overlapping requests by disabling the ask button while the model is responding
* Configure the Ollama endpoint
* Configure the model name
* Configure the maximum number of characters sent per file
* Configure workspace context limits

---

## Planned Features

* Ask about selected code
* Choose model size based on available hardware
* Add model profiles such as `1.5B`, `7B`, `14B`, and `32B`
* Add hardware-aware model recommendations
* Add prompt/context token budget estimates
* Add warnings when chat history, file context, or workspace context may be too large
* Add chunking for larger workspaces
* Add workspace summarization
* Add clear/delete chat session controls
* Optional diagnostics for AI-generated code review findings
* Optional review modes for current file and workspace
* Optional Docker integration for CheapSeek Containerized

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

CheapSeek can also use other Ollama-compatible models installed on your machine.

Examples:

```bash
ollama pull qwen3.5
ollama pull llama3.1:8b
ollama pull codellama:7b
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

The exact `ID`, `SIZE`, and `MODIFIED` values may differ on your machine. The important part is that the `NAME` column includes the model you want to use.

For example:

```text
deepseek-r1:7b
```

or:

```text
qwen3.5
```

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

You can also switch models directly from the CheapSeek chat panel using the model dropdown. CheapSeek lists installed models by calling the local Ollama model list endpoint based on the configured Ollama server.

---

## Extension Settings

CheapSeek contributes the following settings:

```json
{
  "cheapseek.modelEndpoint": "http://localhost:11434/api/chat",
  "cheapseek.modelName": "deepseek-r1:7b",
  "cheapseek.maxCharsPerFile": 12000,
  "cheapseek.maxWorkspaceFiles": 20,
  "cheapseek.maxTotalWorkspaceChars": 80000
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
qwen3.5
llama3.1:8b
codellama:7b
```

If you are unsure which model to run, start with `deepseek-r1:1.5b` and work your way up based on your machine's performance. A brief hardware guide is included below.

Changing the model from the CheapSeek chat panel updates this setting at the workspace level.

### `cheapseek.maxCharsPerFile`

The maximum number of characters CheapSeek sends from a single file to the local model.

Default:

```text
12000
```

This helps avoid oversized prompts and keeps responses faster.

### `cheapseek.maxWorkspaceFiles`

The maximum number of workspace files CheapSeek will include in a workspace question.

Default:

```text
20
```

This prevents workspace mode from sending too many files at once.

### `cheapseek.maxTotalWorkspaceChars`

The maximum total number of characters CheapSeek will send for workspace context.

Default:

```text
80000
```

This keeps workspace prompts bounded so local models can still respond reliably.

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

Different models may behave differently. Some models may produce long reasoning traces, respond more slowly, or require more memory. CheapSeek currently lets the user switch models manually, with hardware-aware recommendations planned for a future version.

---

## Commands

CheapSeek currently provides the following commands:

```text
CheapSeek: Open Chat Panel
CheapSeek: Ask About Current File
CheapSeek: Clear Output
```

### `CheapSeek: Open Chat Panel`

Opens the CheapSeek webview chat panel.

From this panel, users can:

```text
Ask about the current file
Ask about the workspace
Switch between context modes
View chat history
Start a new chat session
Switch between previous chat sessions
Refresh editor/workspace context
Refresh chat history
Refresh installed Ollama models
Switch between installed Ollama models
```

### `CheapSeek: Ask About Current File`

Prompts for a question through the VS Code command palette and displays the response in the CheapSeek output panel.

### `CheapSeek: Clear Output`

Clears the CheapSeek output panel.

---

## Chat Panel

The main CheapSeek interface is the webview chat panel.

It includes:

```text
Current Context
  Shows the current workspace, active file, and selected model.

Model
  Lists installed Ollama models and lets the user switch between them.

Context Mode
  Lets the user choose between Current File and Workspace.

Chats
  Lets the user start a fresh chat or switch between existing chat sessions.

Ask CheapSeek
  Sends the user question to the selected local Ollama model.

Response
  Shows the latest model response.

Chat History
  Shows previous questions and replies for the active chat session.
```

---

## Model Picker

CheapSeek includes a model picker in the chat panel.

The model picker can:

```text
List locally installed Ollama models
Refresh the installed model list
Display model size when available
Display model family when available
Display parameter size when available
Display quantization level when available
Switch the active model for the current workspace
Update the Current Context model label
```

The model picker uses the configured Ollama endpoint to determine the local Ollama server. For the default endpoint:

```text
http://localhost:11434/api/chat
```

CheapSeek derives the Ollama base URL:

```text
http://localhost:11434
```

and requests the installed model list from the local Ollama server.

The selected model is saved to:

```text
cheapseek.modelName
```

at the workspace level.

---

## Chat Sessions and Memory

CheapSeek stores chat history locally using VS Code workspace storage.

The model itself does not permanently remember anything between requests. CheapSeek gives the model conversational memory by saving previous turns locally and including the active chat session's recent history in future prompts.

CheapSeek supports multiple chat sessions.

This allows users to start a fresh chat when:

```text
The current conversation gets too large
The model starts overusing old context
The user switches tasks
The user wants a clean prompt history
```

Only the currently active chat session is included in future prompts.

By default, each session keeps a bounded number of recent turns so prompts do not grow forever.

---

## Workspace Mode

Workspace mode lets CheapSeek answer questions using multiple files from the current VS Code workspace.

CheapSeek intentionally limits workspace context using:

```text
cheapseek.maxWorkspaceFiles
cheapseek.maxCharsPerFile
cheapseek.maxTotalWorkspaceChars
```

This keeps workspace prompts small enough for local models and modest hardware.

Workspace mode excludes common generated or dependency folders such as:

```text
node_modules
dist
out
build
.git
.gradle
.idea
.vscode
bin
obj
target
coverage
```

Workspace mode is currently a bounded context feature, not a full semantic index. Larger projects may need future chunking, summarization, or embeddings.

---

## Request Handling

CheapSeek disables the ask button while a model request is in progress.

This helps prevent duplicate overlapping requests, especially when a local model is slow to load or respond.

The request flow is:

```text
User asks a question
  -> CheapSeek disables the ask button
  -> CheapSeek sends the prompt to Ollama
  -> CheapSeek waits for the model response
  -> CheapSeek saves the reply to the active chat session
  -> CheapSeek re-enables the ask button
```

If an error occurs, CheapSeek displays the error and re-enables the ask button.

---

## Troubleshooting

### The model dropdown says no models were found

Check that Ollama is running:

```bash
ollama serve
```

Then check installed models:

```bash
ollama list
```

If no models are installed, pull one:

```bash
ollama pull deepseek-r1:7b
```

### The model dropdown stays on loading

Check that the configured endpoint is correct:

```text
http://localhost:11434/api/chat
```

Also test Ollama directly:

```bash
curl http://localhost:11434/api/tags
```

### A model works in the terminal but fails in CheapSeek

A small terminal prompt may work while a larger CheapSeek prompt may be too heavy.

Try:

```text
Switching to Current File mode instead of Workspace mode
Starting a new chat session
Using a smaller model
Lowering maxWorkspaceFiles
Lowering maxCharsPerFile
Lowering maxTotalWorkspaceChars
```

### A model responds slowly

Large models can take a long time to load or respond, especially without GPU acceleration.

Try a smaller model such as:

```text
deepseek-r1:1.5b
deepseek-r1:7b
```

### The model prints long reasoning traces

Some local models may expose long thinking/reasoning text depending on the model and prompt behavior.

CheapSeek prompt instructions ask the model to answer directly and avoid exposing internal reasoning, but final behavior depends on the selected model.

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

### 5. Run CheapSeek

In the Extension Development Host window, run:

```text
CheapSeek: Open Chat Panel
```

Then ask a question in either:

```text
Current File mode
Workspace mode
```

---

## Project Structure

Current structure:

```text
src/
  extension.ts
  types.ts

  agent/
    ollamaClient.ts
    ollamaModels.ts
    prompts.ts

  documents/
    activeDocument.ts
    filePayload.ts
    workspacePayload.ts

  memory/
    chatHistory.ts

  ui/
    chatWebview.ts

  test/
    extension.test.ts
```

### `extension.ts`

Main VS Code extension entry point.

Handles:

```text
Command registration
Webview creation
Message routing
Current file questions
Workspace questions
Model list loading
Model switching
Chat session switching
Chat history updates
Output panel command support
```

### `types.ts`

Shared TypeScript interfaces.

### `agent/`

Handles prompt construction, Ollama communication, and Ollama model discovery.

```text
ollamaClient.ts
  Sends chat requests to the configured Ollama endpoint.

ollamaModels.ts
  Lists installed Ollama models from the local Ollama server.

prompts.ts
  Builds current-file and workspace prompts.
```

### `documents/`

Handles VS Code document and workspace context collection.

```text
activeDocument.ts
  Finds the active or most recently active editor document.

filePayload.ts
  Converts a VS Code document into a bounded file payload.

workspacePayload.ts
  Collects bounded workspace file payloads.
```

### `memory/`

Handles local chat history and chat sessions.

```text
chatHistory.ts
  Stores chat sessions, active session ID, and recent chat turns in workspaceState.
```

### `ui/`

Handles the CheapSeek webview.

```text
chatWebview.ts
  Returns the HTML, CSS, and JavaScript for the CheapSeek chat panel.
```

---

## Architecture

CheapSeek is designed around a simple local-first pipeline:

```text
VS Code command or webview action
  -> collect current file or workspace context
  -> collect active chat session history
  -> build prompt
  -> send request to selected local Ollama model
  -> show answer in VS Code
  -> save answer to active chat session
```

The architecture is split into six layers:

### Command Layer

Determines what the user asked CheapSeek to do.

Examples:

```text
Open chat panel
Ask about current file
Ask about workspace
Clear output
Switch model
Start new chat
Switch chat session
```

### Document Layer

Determines which files, selections, or workspace content should be included.

### Context Layer

Controls how much code and history should be sent to the model.

### Agent Layer

Handles communication with the local LLM through the Ollama API.

### UI Layer

Controls how answers, model selection, chat sessions, and history are displayed inside VS Code.

### Memory Layer

Stores chat sessions and recent chat history locally through VS Code workspace storage.

---

## Local-First Goal

CheapSeek Native is intended to keep source code local.

The extension sends code context only to the configured local endpoint. By default, this is Ollama running on:

```text
localhost:11434
```

No cloud API is required for the default setup.

Chat history is also stored locally in VS Code workspace storage.

The model list is loaded from the local Ollama server.

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

CheapSeek is still experimental. The current focus is building a usable local-first coding assistant before adding heavier features like indexing, embeddings, automated code review, hardware-aware model selection, or Docker-based model management.
