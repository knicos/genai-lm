# GenAI Little Language Machine

An educational application that demonstrates how a tiny language model can be trained and explored directly in the browser. A free hosted version of the application is at https://lm.gen-ai.fi. The training and interence occurs entirely in the browser using WebGL or WebGPU to avoid sending data to servers. The application has been created by the Generation AI strategic research project in Finland which produces AI literacy tools and materials for K-12 (https://gen-ai.fi).

## Overview

This project is designed to help learners understand key language model concepts such as:

- data preparation
- tokenization
- training loops
- inference and generation
- model evaluation and debugging

Learning is focused around the human roles in the process, how scale compares to real large models and it highlights the numeric predictive nature of the models that can lead to issues such as bias and hallucination.

## Tech Stack

- React + TypeScript
- Vite
- ESLint + testing tools
- WebGPU
- WebRTC and Peerjs.

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm (or your preferred package manager)
- Tests require a GPU for WebGPU in Node.

### Installation

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Then open the local URL shown in your terminal.

## Configuration

To use peer-to-peer collabation features, a signaling server is required, along with a way to get a TURN access token. Also, the data and model repositories use an API. The code for the server is not included in this repository.

Example:

```bash
# .env example
VITE_LOGGING_ENDPOINT=http://localhost:9000/log/llm
VITE_APP_PEER_SERVER=localhost
VITE_APP_PEER_SECURE=0
VITE_APP_PEER_KEY=somekey
VITE_APP_PEER_PORT=9000
VITE_APP_PEER_URL=http://localhost:9000
VITE_APP_API=https://localhost:9001
```

## Acknowledgements

Funded by the Finnish Strategic Research Council via the Generation AI research project.

Cite:

Nicolas Pope and Matti Tedre. 2025. A Teachable Machine for Transformers. In Proceedings of the 25th Koli Calling International Conference on Computing Education Research (Koli Calling '25). Association for Computing Machinery, New York, NY, USA, Article 50, 1–3. https://doi.org/10.1145/3769994.3770061
