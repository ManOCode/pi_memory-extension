# Agent

In the context of Artificial Intelligence, an **Agent** is a system that uses a Large Language Model (LLM) as its "brain" to autonomously achieve a goal by interacting with its environment.

Unlike a standard chatbot—which simply predicts the next token in a conversation—an agent is designed to **reason, plan, and take actions**.

## Core Components of an Agent

An agent typically consists of four primary pillars:

1.  **The Brain (LLM):** The core model that handles reasoning, decision-making, and natural language understanding. It decides *which* action to take based on the current state and the goal.
2.  **Tools (Capabilities):** External functions the agent can call to interact with the world. Examples include:
    *   Executing code (e.g., a Python interpreter or Bash shell).
    *   Searching the web.
    *   Reading/Writing files.
    *   Calling APIs.
3.  **Planning & Reasoning:** The process of breaking a complex goal into smaller, manageable steps. Common patterns include:
    *   **Chain-of-Thought:** Thinking through the problem step-by-step.
    *   **ReAct (Reason + Act):** A loop where the agent thinks, takes an action, observes the result, and then thinks again based on that observation.
4.  **Memory:** The ability to store and retrieve information.
    *   **Short-term memory:** The current conversation history (context window).
    *   **Long-term memory:** External databases or files (like a "memory extension") that allow the agent to remember facts across different sessions.

## Chatbot vs. Agent: A Simple Comparison

| Feature | Chatbot (Standard LLM) | AI Agent |
| :--- | :--- | :--- |
| **Output** | Text/Dialogue | Text + Actions (Tool calls) |
| **Interaction** | Reactive (responds to prompt) | Proactive (pursues a goal) |
| **Environment** | Static (only knows its training data) | Dynamic (can read files, run code, search) |
| **Workflow** | Prompt $\rightarrow$ Response | Prompt $\rightarrow$ Plan $\rightarrow$ Act $\rightarrow$ Observe $\rightarrow$ Repeat |

## Example: The `pi` Coding Agent
The `pi` coding agent is a prime example of an agent. It doesn't just talk about code; it has access to a **harness** that gives it tools like `bash`, `read`, `edit`, and `write`. 

When tasked to "fix a bug," the agent:
1. **Plans:** Decides which files to investigate.
2. **Acts:** Uses `bash` to find the file and `read` to see the code.
3. **Observes:** Analyzes the error in the code.
4. **Acts:** Uses `edit` to apply the fix.
5. **Verifies:** Uses `bash` to run tests and ensure it works.

## Collaborative Agent Workflow: Architect & Specialist

To manage the `memory-extension` project, we employ a dual-agent collaboration loop to separate strategic vision from tactical implementation.

### Architectural Standards: The Onion Pattern
All extensions in this project must follow a strict dependency flow to ensure maintainability:
**[ Client/Tool Layer ]** $\rightarrow$ **[ Behaviour/Domain Layer ]** $\rightarrow$ **[ Abstraction Layer (Interfaces) ]** $\leftarrow$ **[ Infrastructure/Persistence Layer ]**

- **Abstraction:** Central contracts that define *what* the system does.
- **Behaviour:** Business logic and intelligence (e.g., deduplication, ranking).
- **Infrastructure:** Concrete implementations (e.g., FileSystem) handling raw I/O.

### The Roles
- **The Project Architect:** Focuses on the "Why" and "What." Remains blind to current tool signatures to avoid implementation bias. Defines the roadmap and conceptual requirements. Enforces the **Onion Pattern**.
- **The Extension Specialist:** Focuses on the "How." Expert in the `/skills` and `memory-extension` tools. Implements the technical requirements while adhering to the architectural standards.

### The Handoff Protocol
1. **Architect $\rightarrow$ Specialist (Requirement):** The Architect identifies a capability gap and defines a high-level requirement.
2. **Specialist $\rightarrow$ Architect (Implementation):** The Specialist implements the logic, then provides a technical report and verification results.
3. **Architect $\rightarrow$ Specialist (Validation):** The Architect reviews the implementation against the project vision and either signs off or requests a pivot.

## Knowledge Base Design Principles (Lessons Learned)

When evolving the memory extension, we adhere to these core principles to prevent knowledge entropy:

1. **Relevance-First Retrieval:** Move beyond binary search. Use weighted scoring (ID > Title > Meta > Body) and **Context Hints** to enable associative recall and boost relevant but non-exact matches.
2. **Priority-Weighted Recall:** Not all memories are equal. `CRITICAL` knowledge must always surface above `STANDARD` or `TRANSIENT` data when relevance is equal.
3. **Temporal Decay (TTL):** Transient data should have a "half-life." Automatic expiration prevents short-term context from polluting long-term memory.
4. **Knowledge Synthesis (Replace vs. Append):**
    - **Append:** For additive knowledge.
    - **Replace:** For correcting factual errors (maintaining a "Single Source of Truth" while archiving history).
5. **Web of Knowledge & Mapping:** Use bi-directional linking for traversal and **Visual Cognitive Mapping** (e.g., Mermaid.js) to audit knowledge topology and identify orphans or hubs.
6. **Content Normalization:** Always normalize text (lowercase, trim, punctuation removal) before deduplication or search to prevent "near-duplicate" fragmentation.
7. **Instructional Tooling:** Tool descriptions should be prescriptive. Instead of "Store memory," use "Store memory; use `replace` when correcting a factual error."
8. **Unified Validation:** Use a unified test runner for both unit and stress testing to ensure structural integrity under load.
9. **Operational Guidance:** Provide an agent-facing Design Guide that translates technical tools into a strategic manual for the AI.
