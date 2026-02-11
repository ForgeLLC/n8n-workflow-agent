/**
 * Workflow Builder Handler
 * 
 * Handles multi-agent workflow building in background worker.
 * Uses message passing to communicate with content script.
 */

import { createAdapter } from '../ai/adapters/index.js'
import { getModelAdapter, getDefaultModelAdapter, DEFAULT_MODEL, MODEL_CONFIGS } from '../lib/workflow-builder/config/llm-config.js'
import { createWorkflowBuilder } from '../lib/workflow-builder/index.js'

/**
 * Execute function via content script
 * This will be passed to workflow builder as executeFunction
 */
async function executeFunctionViaContent(functionCall, tabId) {
  return new Promise((resolve, reject) => {
    const requestId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Set up response listener
    const messageListener = (message, sender, sendResponse) => {
      if (message.type === 'n8nChatFunctionResult' && message.requestId === requestId) {
        chrome.runtime.onMessage.removeListener(messageListener)
        if (message.error) {
          reject(new Error(message.error))
        } else {
          resolve(message.result || message)
        }
        return true
      }
      return false
    }
    
    chrome.runtime.onMessage.addListener(messageListener)
    
    // Send message to content script
    chrome.tabs.sendMessage(tabId, {
      type: 'n8nChatExecuteFunction',
      functionName: functionCall.name,
      args: functionCall.arguments || functionCall.args || {},
      requestId: requestId
    }, (response) => {
      // Check if we got a direct response (content script may respond directly)
      if (response && !chrome.runtime.lastError) {
        chrome.runtime.onMessage.removeListener(messageListener)
        if (response.error) {
          reject(new Error(response.error))
        } else {
          resolve(response.result || response || { success: true })
        }
      } else if (chrome.runtime.lastError) {
        // Only reject on actual error, not if response is pending
        // Content script may respond via message listener instead
        if (!chrome.runtime.lastError.message.includes('Could not establish connection')) {
          chrome.runtime.onMessage.removeListener(messageListener)
          reject(new Error(chrome.runtime.lastError.message))
        }
      }
      // If no direct response, wait for message listener
    })
    
    // Timeout after 30 seconds
    setTimeout(() => {
      chrome.runtime.onMessage.removeListener(messageListener)
      reject(new Error('Function execution timeout'))
    }, 30000)
  })
}

/**
 * Handle workflow builder chat request
 * @param {Object} data - Request data
 * @param {number} tabId - Tab ID
 * @param {Object} port - Port for streaming
 */
export async function handleWorkflowBuilderChat(data, tabId, port) {
  const { message, workflowId, workflowContext, settings } = data
  
  // Validate inputs
  if (!message) {
    port.postMessage({
      type: 'error',
      requestId: data.requestId,
      error: 'Message is required'
    })
    return
  }
  
  try {
    // Determine model ID from settings
    // Try to match n8n model format first, then fall back to provider-based
    let modelId = DEFAULT_MODEL
    const model = settings.model?.toLowerCase() || ''
    // Get provider early to avoid "Cannot access before initialization" error
    const currentProvider = settings.provider || 'anthropic'
    
    // Map common model names to n8n model IDs
    if (model.includes('claude-sonnet') || model.includes('sonnet-4') || model.includes('sonnet4')) {
      modelId = 'claude-sonnet-4.5'
    } else if (model.includes('claude-opus') || model.includes('opus-4') || model.includes('opus4')) {
      modelId = 'claude-opus-4.5'
    } else if (model.includes('claude-haiku') || model.includes('haiku-4') || model.includes('haiku4')) {
      modelId = 'claude-haiku-4.5'
    } else if (model.includes('gpt-5') || model.includes('gpt5')) {
      modelId = 'gpt-5.2'
    } else if (model.includes('glm-4') || model.includes('glm4')) {
      modelId = 'glm-4.7'
    } else if (model.includes('gemini-3-flash') || model.includes('gemini3flash')) {
      modelId = 'gemini-3-flash'
    } else if (model.includes('gemini-3-pro') || model.includes('gemini3pro')) {
      modelId = 'gemini-3-pro'
    } else if (model.includes('deepseek-v3') || model.includes('deepseekv3')) {
      modelId = 'deepseek-v3.2'
    } else if (model.includes('devstral')) {
      modelId = 'devstral'
    } else {
      // Fallback: Use provider-based adapter (existing behavior)
      // This maintains backward compatibility
      console.warn(`[WorkflowBuilder] Unknown model "${settings.model}", using provider-based adapter`)
    }
    
    // Get API key for the model
    const modelConfig = MODEL_CONFIGS[modelId] || { provider: settings.provider }
    // CRITICAL: Use modelConfig.provider, NOT settings.provider for fallback
    const provider = modelConfig.provider || settings.provider
    
    // SECURITY: Only log non-sensitive configuration info
    console.log(`[WorkflowBuilder] Model ID: ${modelId}, Provider: ${provider}`)
    
    // Get API key - prioritize provider-specific key
    let apiKey = settings.apiKeys?.[provider]
    if (!apiKey) {
      // Fallback to general apiKey if provider-specific key not found
      apiKey = settings.apiKey
      console.warn(`[WorkflowBuilder] Provider-specific API key not found for "${provider}", using general apiKey`)
    }
    
    if (!apiKey) {
      throw new Error(`API key not found for provider "${provider}". Please configure your ${provider} API key in settings.`)
    }
    
    // SECURITY: Never log API key details - only confirm it exists
    console.log(`[WorkflowBuilder] API key configured: ${!!apiKey}`)
    
    // Create adapter using n8n's model config if available, otherwise fallback
    let adapter
    try {
      adapter = getModelAdapter(modelId, { apiKey })
      console.log(`[WorkflowBuilder] Successfully created adapter for model: ${modelId}, provider: ${provider}`)
      
    } catch (error) {
      // Fallback to provider-based adapter
      console.warn(`[WorkflowBuilder] Failed to use model adapter, falling back to provider adapter:`, error)
      console.warn(`[WorkflowBuilder] Using provider: ${provider} (from modelConfig, NOT settings.provider)`)

      let fallbackModel = settings.model || 'claude-sonnet-4-5-20250929'

      console.log(`[WorkflowBuilder] Creating fallback adapter for provider: ${provider}, model: ${fallbackModel}`)
      
      // CRITICAL: Use modelConfig.provider, NOT settings.provider
      // Ensure we have the correct API key for the provider
      const fallbackApiKey = settings.apiKeys?.[provider] || apiKey
      if (!fallbackApiKey) {
        throw new Error(`API key not found for provider "${provider}". Please configure your ${provider} API key in settings.`)
      }
      
      // CRITICAL: Use provider from modelConfig, not settings
      adapter = createAdapter(provider, {
        apiKey: fallbackApiKey,
        model: fallbackModel,
        temperature: modelConfig.temperature,
        maxTokens: modelConfig.maxTokens
      })
      
      console.log(`[WorkflowBuilder] Fallback adapter created for provider: ${provider}, adapter type: ${adapter.constructor.name}`)
    }
    
    // Create execute function wrapper
    const executeFunction = async (functionCall) => {
      return await executeFunctionViaContent(functionCall, tabId)
    }
    
    // Create workflow builder with stage-specific adapters (n8n style)
    // createWorkflowBuilder is loaded at module initialization (top level)
    // n8n uses the same model for all stages in production, but allows per-stage config
    // We'll use the same adapter for all stages by default
    const stageAdapters = {
      default: adapter,
      supervisor: adapter,
      responder: adapter,
      discovery: adapter,
      builder: adapter,
      configurator: adapter,
      parameterUpdater: adapter
    }
    
    // Node types will be loaded dynamically by agents via node-types-loader
    // We pass empty array here, agents will fetch from n8n editor when needed
    const nodeTypes = []
    
    // Create workflow builder
    // Wrap in try-catch to handle import errors gracefully
    let builder
    try {
      builder = await createWorkflowBuilder({
        adapter: stageAdapters, // Pass per-stage adapters
        executeFunction,
        workflowId: workflowId || `workflow_${Date.now()}`,
        parsedNodeTypes: nodeTypes, // Filtered node types
        options: {
          logger: console,
          maxIterations: 20
        }
      })
    } catch (createError) {
      console.error('[WorkflowBuilder] Failed to create builder:', createError)
      port.postMessage({
        type: 'error',
        requestId: data.requestId,
        error: `Failed to create workflow builder: ${createError.message}`
      })
      return
    }
    
    // Stream workflow building process
    port.postMessage({
      type: 'start',
      requestId: data.requestId,
      data: { message: 'Starting multi-agent workflow building...' }
    })
    
    // Process chat
    try {
      for await (const event of builder.chat(message, workflowContext)) {
        port.postMessage({
          type: 'event',
          requestId: data.requestId,
          event: event
        })
        
        // Handle different event types
        if (event.type === 'phase_start') {
          port.postMessage({
            type: 'data',
            requestId: data.requestId,
            data: { 
              message: `🔍 Starting ${event.phase} phase...`,
              phase: event.phase
            }
          })
        } else if (event.type === 'phase_complete') {
          // For responder phase, include the response text
          if (event.phase === 'responder') {
            const responseText = event.response || event.result?.response || event.result
            port.postMessage({
              type: 'data',
              requestId: data.requestId,
              data: { 
                message: `✅ ${event.phase} phase completed`,
                phase: event.phase,
                result: event.result || event.response,
                response: responseText
              }
            })
          } else {
            port.postMessage({
              type: 'data',
              requestId: data.requestId,
              data: { 
                message: `✅ ${event.phase} phase completed`,
                phase: event.phase,
                result: event.result || event.response
              }
            })
          }
        } else if (event.type === 'phase_error') {
          port.postMessage({
            type: 'error',
            requestId: data.requestId,
            error: `Error in ${event.phase}: ${event.error}`
          })
        } else if (event.type === 'complete') {
          port.postMessage({
            type: 'complete',
            requestId: data.requestId,
            data: {
              message: 'Workflow building completed successfully!',
              workflowJSON: event.workflowJSON
            }
          })
        }
      }
    } catch (streamError) {
      console.error('[WorkflowBuilder] Error during chat stream:', streamError)
      port.postMessage({
        type: 'error',
        requestId: data.requestId,
        error: `Error during workflow building: ${streamError.message}`
      })
      return
    }
    
    port.postMessage({
      type: 'end',
      requestId: data.requestId
    })
    
  } catch (error) {
    console.error('[WorkflowBuilder] Error:', error)
    port.postMessage({
      type: 'error',
      requestId: data.requestId,
      error: error.message || 'Unknown error occurred'
    })
  }
}
