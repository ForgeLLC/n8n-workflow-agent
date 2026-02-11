export class BaseAdapter {
  constructor({ apiKey, model }) {
    this.apiKey = apiKey
    this.model = model
  }

  async analyze({ systemPrompt, userPrompt, schema }) {
    throw new Error("analyze() not implemented")
  }

  _validateJSON(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid AI response: Response is not an object")
    }
    
    // Support multiple schema types:
    // 1. Workflow analysis schema: {issues: [], summary: ""}
    // 2. Response generation schema: {response: ""}
    // 3. Generic schema: any object
    
    // If it has 'response' field, it's a response generation (for responder agent)
    if (data.response !== undefined) {
      return data
    }
    
    // If it has 'issues' field, it's workflow analysis (for analyze workflow)
    if (Array.isArray(data.issues)) {
      if (!data.summary) {
        // Auto-fill summary if missing
        data.summary = `Found ${data.issues.length} issues in the workflow.`
      }
      return data
    }
    
    // Generic object - return as is
    return data
  }
}
