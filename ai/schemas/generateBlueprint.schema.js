export const generateBlueprintSchema = {
  name: "generate_workflow_blueprint",
  description: "Generate a workflow blueprint plan from user intent",
  parameters: {
    type: "object",
    properties: {
      steps: {
        type: "array",
        items: { type: "string" },
        description: "High-level execution steps"
      },
      nodes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string", description: "n8n node type (e.g., n8n-nodes-base.httpRequest)" },
            purpose: { type: "string" }
          },
          required: ["name", "type", "purpose"]
        }
      },
      connections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            from: { type: "string" },
            to: { type: "string" },
            type: {
              type: "string",
              enum: ["main", "ai_tool", "ai_agent", "ai_memory", "ai_outputParser", "ai_languageModel", "ai_document", "ai_embedding", "ai_vectorStore", "ai_retriever"],
              description: "Connection type. Use 'main' for standard connections, 'ai_*' types for AI agent node connections"
            }
          },
          required: ["from", "to"]
        }
      },
      explanation: { type: "string" }
    },
    required: ["steps", "nodes", "connections", "explanation"]
  }
}
