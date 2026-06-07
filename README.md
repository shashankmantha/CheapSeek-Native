CheapSeek

CheapSeek is a VS Code extension that connects your editor to a locally running LLM (default is the deepseek R1) through Ollama .

The goal is to turn VS Code into a lightweight local code assistant that can inspect the current file, selected code, and eventually the whole workspace without sending your code to a cloud API.

CheapSeek is built as a local-first experiment using models like DeepSeek R1 through Ollama.
Current Features

    Ask a local LLM about the current open file
    Send file contents to a local Ollama model
    Display responses in a VS Code output panel
    Configurable Ollama endpoint
    Configurable model name
    Configurable max characters per file

Planned Features

    Ask about selected code
    Ask about the current workspace
    Choose model size based on available hardware
    Add model profiles such as 1.5B, 7B, 14B, and 32B
    Add chunking for larger workspaces
    Add a webview chat/dashboard
    Optional diagnostics for AI-generated code review findings

--------Requirements--------

CheapSeek requires Ollama to be installed and running locally.

 1.) Install Ollama:

  https://ollama.com

2.) Start Ollama:

  ollama serve
  

If Ollama is already running, you may see:

    Error: listen tcp 127.0.0.1:11434: bind: address already in use
  
That is okay. It means the Ollama server is already active.


3.) Pull a supported model: 
( deepseek-r1 is the reccomended model for this project, model versions discussed in Extension Settings section ) 

  ollama pull deepseek-r1:7b 


4.) Check installed models:

  ollama list

If DeepSeek was installed successfully, you should see output similar to:

    NAME              ID              SIZE      MODIFIED
    deepseek-r1:7b    755ced02ce7b    4.7 GB    5 seconds ago

The exact `ID`, `SIZE`, and `MODIFIED` values may differ on your machine. The important part is that the `NAME` column includes:

    deepseek-r1:7b


--------Default Model--------

CheapSeek currently defaults to:

  deepseek-r1:7b

Default endpoint:

  http://localhost:11434/api/chat

(You can change these in VS Code settings.)



--------Extension Settings--------

CheapSeek contributes the following settings:

  {
    "cheapseek.modelEndpoint": "http://localhost:11434/api/chat",
    "cheapseek.modelName": "deepseek-r1:7b",
    "cheapseek.maxCharsPerFile": 12000
  }



- cheapseek.modelEndpoint: The local Ollama chat API endpoint.

  Default: http://localhost:11434/api/chat

- cheapseek.maxCharsPerFile: The maximum number of characters CheapSeek sends from the current file to the local model. helps avoid oversized prompts.

- cheapseek.modelName: The Ollama model CheapSeek should use.

  Example values:

    deepseek-r1:1.5b
    deepseek-r1:7b
    deepseek-r1:14b
    deepseek-r1:32b

  Based on your current hardware specs, if you are unsure which one you should run start at the 1.5b partition and work your way up. 

-------- Hardware Guide -------
Local model performance depends heavily on available RAM, VRAM, CPU, and whether the model is running on GPU or CPU. These are rough guidelines, not strict requirements. 

    deepseek-r1:1.5b
      Recommended RAM: 8 GB+
      Best for: low-end laptops, quick questions, small files
      Notes: fastest option, but weaker reasoning

    deepseek-r1:7b
      Recommended RAM: 16 GB+
      Best for: general local coding help, current-file questions, selected-code explanations
      Notes: good balance of speed and quality

    deepseek-r1:14b
      Recommended RAM: 32 GB+
      Best for: deeper code review, larger files, better reasoning
      Notes: slower than 7B and may feel heavy on laptops

    deepseek-r1:32b
      Recommended RAM: 64 GB+
      Best for: stronger local reasoning and more complex workspace analysis
      Notes: much slower without a strong GPU

This project was made with the deepseek-r1 model line in mind but can run with other models if u so please
--------Commands--------

CheapSeek currently provides:

CheapSeek: Ask About Current File
CheapSeek: Clear Output

Planned commands:

CheapSeek: Ask About Selection
CheapSeek: Ask About Workspace
CheapSeek: Choose Local Model
CheapSeek: Review Current File
CheapSeek: Review Workspace

--------Development--------

1.) Install dependencies:

  npm install

2.) Compile:

  npm run compile

3.) Watch mode:

  npm run watch

4.) Run the extension:

    - Open this project in VS Code.

    - Open the Run and Debug panel.

    - Select Run Extension.

    - Press the green play button.

(This opens a new Extension Development Host window.)

5.) In that window, run:

  CheapSeek: Ask About Current File



--------Project Structure--------

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

--------Architecture--------

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

--------Local-First Goal--------

CheapSeek is intended to keep source code local.

The extension sends code context only to the configured local endpoint. By default, this is Ollama running on localhost.

No cloud API is required for the default setup.

Notes: 

This project started as a simple TODO/FIXME scanner to learn how VS Code extensions interact with file data, diagnostics, and output panels.

That scanner served as a precursor project. CheapSeek now focuses on using the same file-reading scaffolding to power a local LLM code assistant.

