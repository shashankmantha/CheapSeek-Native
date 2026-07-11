# CheapSeek Native

CheapSeek Native is a VS Code extension that connects your editor to a locally running LLM through a host-installed Ollama server.

The default model is currently `deepseek-r1:7b`.

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
* Configure the Ollama endpoint
* Configure the model name
* Configure the maximum number of characters sent per file
* Configure workspace context limits

---

## Planned Features

* Ask about selected code
* Choose model size based on available hardware
* Add model profiles such as `1.5B`, `7B`, `14B`, and `32B`
* Add chunking for larger workspaces
* Add workspace summarization
* Add clear/delete chat session controls
* Optional diagnostics for AI-generated code review findings
* Optional review modes for current file and workspace

---

## Requirements

CheapSeek Native requires Ollama to be installed and running locally on your host machine.

### 1. Install Ollama

Install Ollama from:

```text
https://ollama.com
2. Start Ollama
ollama serve

If Ollama is already running, you may see:

Error: listen tcp 127.0.0.1:11434: bind: address already in use

That is okay. It means the Ollama server is already active.

3. Pull a supported model

deepseek-r1 is the recommended model line for this project.

ollama pull deepseek-r1:7b

Other supported examples include:

ollama pull deepseek-r1:1.5b
ollama pull deepseek-r1:14b
ollama pull deepseek-r1:32b
4. Check installed models
ollama list

If DeepSeek was installed successfully, you should see output similar to:

NAME              ID              SIZE      MODIFIED
deepseek-r1:7b    755ced02ce7b    4.7 GB    5 seconds ago

The exact ID, SIZE, and MODIFIED values may differ on your machine. The important part is that the NAME column includes:

deepseek-r1:7b

or whichever model you chose.

Default Model

CheapSeek Native currently defaults to:

deepseek-r1:7b

Default endpoint:

http://localhost:11434/api/chat

You can change both values in VS Code settings.

Extension Settings

CheapSeek contributes the following settings:

{
  "cheapseek.modelEndpoint": "http://localhost:11434/api/chat",
  "cheapseek.modelName": "deepseek-r1:7b",
  "cheapseek.maxCharsPerFile": 12000,
  "cheapseek.maxWorkspaceFiles": 20,
  "cheapseek.maxTotalWorkspaceChars": 80000
}
cheapseek.modelEndpoint

The local Ollama chat API endpoint.

Default:

http://localhost:11434/api/chat
cheapseek.modelName

The Ollama model CheapSeek should use.

Default:

deepseek-r1:7b

Example values:

deepseek-r1:1.5b
deepseek-r1:7b
deepseek-r1:14b
deepseek-r1:32b

If you are unsure which model to run, start with deepseek-r1:1.5b and work your way up based on your machine's performance. A brief hardware guide is included below.

cheapseek.maxCharsPerFile

The maximum number of characters CheapSeek sends from a single file to the local model.

Default:

12000

This helps avoid oversized prompts and keeps responses faster.

cheapseek.maxWorkspaceFiles

The maximum number of workspace files CheapSeek will include in a workspace question.

Default:

20

This prevents workspace mode from sending too many files at once.

cheapseek.maxTotalWorkspaceChars

The maximum total number of characters CheapSeek will send for workspace context.

Default:

80000

This keeps workspace prompts bounded so local models can still respond reliably.

Hardware Guide

Local model performance depends heavily on available RAM, VRAM, CPU, and whether the model is running on GPU or CPU.

These are rough guidelines, not strict requirements.

deepseek-r1:1.5b

Recommended RAM:

8 GB+

Best for:

Low-end laptops, quick questions, and small files

Notes:

Fastest option, but weaker reasoning.
deepseek-r1:7b

Recommended RAM:

16 GB+

Best for:

General local coding help, current-file questions, and selected-code explanations

Notes:

Good balance of speed and quality.
deepseek-r1:14b

Recommended RAM:

32 GB+

Best for:

Deeper code review, larger files, and better reasoning

Notes:

Slower than 7B and may feel heavy on laptops.
deepseek-r1:32b

Recommended RAM:

64 GB+

Best for:

Stronger local reasoning and more complex workspace analysis

Notes:

Much slower without a strong GPU.

CheapSeek was built with the deepseek-r1 model line in mind, but it can run with other Ollama-compatible models.

Commands

CheapSeek currently provides the following commands:

CheapSeek: Open Chat Panel
CheapSeek: Ask About Current File
CheapSeek: Clear Output
CheapSeek: Open Chat Panel

Opens the CheapSeek webview chat panel.

From this panel, users can:

Ask about the current file
Ask about the workspace
Switch between context modes
View chat history
Start a new chat session
Switch between previous chat sessions
Refresh editor/workspace context
Refresh chat history
CheapSeek: Ask About Current File

Prompts for a question through the VS Code command palette and displays the response in the CheapSeek output panel.

CheapSeek: Clear Output

Clears the CheapSeek output panel.

Chat Panel

The main CheapSeek interface is the webview chat panel.

It includes:

Current Context
  Shows the current workspace, active file, and selected model.

Context Mode
  Lets the user choose between Current File and Workspace.

Chats
  Lets the user start a fresh chat or switch between existing chat sessions.

Ask CheapSeek
  Sends the user question to the local Ollama model.

Response
  Shows the latest model response.

Chat History
  Shows previous questions and replies for the active chat session.
Chat Sessions and Memory

CheapSeek stores chat history locally using VS Code workspace storage.

The model itself does not permanently remember anything between requests. CheapSeek gives the model conversational memory by saving previous turns locally and including the active chat session's recent history in future prompts.

CheapSeek supports multiple chat sessions.

This allows users to start a fresh chat when:

The current conversation gets too large
The model starts overusing old context
The user switches tasks
The user wants a clean prompt history

Only the currently active chat session is included in future prompts.

By default, each session keeps a bounded number of recent turns so prompts do not grow forever.

Workspace Mode

Workspace mode lets CheapSeek answer questions using multiple files from the current VS Code workspace.

CheapSeek intentionally limits workspace context using:

cheapseek.maxWorkspaceFiles
cheapseek.maxCharsPerFile
cheapseek.maxTotalWorkspaceChars

This keeps workspace prompts small enough for local models and modest hardware.

Workspace mode excludes common generated or dependency folders such as:

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

Workspace mode is currently a bounded context feature, not a full semantic index. Larger projects may need future chunking, summarization, or embeddings.

Development
1. Install dependencies
npm install
2. Compile
npm run compile
3. Watch mode
npm run watch
4. Run the extension

Open this project in VS Code.

Then:

Open the Run and Debug panel.
Select Run Extension.
Press the green play button.

This opens a new Extension Development Host window.

5. Run CheapSeek

In the Extension Development Host window, run:

CheapSeek: Open Chat Panel

Then ask a question in either:

Current File mode
Workspace mode
Project Structure

Current structure:

src/
  extension.ts
  types.ts

  agent/
    ollamaClient.ts
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
extension.ts

Main VS Code extension entry point.

Handles:

Command registration
Webview creation
Message routing
Current file questions
Workspace questions
Chat session switching
Chat history updates
Output panel command support
types.ts

Shared TypeScript interfaces.

agent/

Handles prompt construction and Ollama communication.

ollamaClient.ts
  Sends chat requests to the configured Ollama endpoint.

prompts.ts
  Builds current-file and workspace prompts.
documents/

Handles VS Code document and workspace context collection.

activeDocument.ts
  Finds the active or most recently active editor document.

filePayload.ts
  Converts a VS Code document into a bounded file payload.

workspacePayload.ts
  Collects bounded workspace file payloads.
memory/

Handles local chat history and chat sessions.

chatHistory.ts
  Stores chat sessions, active session ID, and recent chat turns in workspaceState.
ui/

Handles the CheapSeek webview.

chatWebview.ts
  Returns the HTML, CSS, and JavaScript for the CheapSeek chat panel.
Architecture

CheapSeek is designed around a simple local-first pipeline:

VS Code command or webview action
  -> collect current file or workspace context
  -> collect active chat session history
  -> build prompt
  -> send request to local Ollama model
  -> show answer in VS Code
  -> save answer to active chat session

The architecture is split into six layers:

Command Layer

Determines what the user asked CheapSeek to do.

Examples:

Open chat panel
Ask about current file
Ask about workspace
Clear output
Document Layer

Determines which files, selections, or workspace content should be included.

Context Layer

Controls how much code and history should be sent to the model.

Agent Layer

Handles communication with the local LLM through the Ollama API.

UI Layer

Controls how answers, chat sessions, and history are displayed inside VS Code.

Memory Layer

Stores chat sessions and recent chat history locally through VS Code workspace storage.

Local-First Goal

CheapSeek Native is intended to keep source code local.

The extension sends code context only to the configured local endpoint. By default, this is Ollama running on:

localhost:11434

No cloud API is required for the default setup.

Chat history is also stored locally in VS Code workspace storage.

CheapSeek Native vs CheapSeek Containerized

CheapSeek is planned to have two local-first deployment options:

CheapSeek Native

Runs against an Ollama server installed directly on the host machine.

This version is best if you already use Ollama locally or want full control over your Ollama installation.

CheapSeek Containerized

Runs against an Ollama server inside a Docker container.

This version is intended to make setup more portable and reproducible while still keeping the model runtime local.

Both versions communicate with Ollama through the Ollama API.

Notes

This project started as a simple TODO/FIXME scanner to learn how VS Code extensions interact with file data, diagnostics, and output panels.

That scanner served as a precursor project. CheapSeek now uses the same file-reading scaffolding to power a local LLM code assistant.

CheapSeek is still experimental. The current focus is building a usable local-first coding assistant before adding heavier features like indexing, embeddings, automated code review, or Docker-based model management.
