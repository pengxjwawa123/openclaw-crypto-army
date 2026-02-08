import { Router, Request, Response } from 'express';
import { DockerManager } from '../services/docker';
import { saveChatMessage, getBotChatMessages, clearBotChatMessages } from '../services/database';
import { v4 as uuidv4 } from 'uuid';

interface LLMResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface AnthropicResponse {
  content?: Array<{
    text?: string;
  }>;
}

export function createChatRouter(_dockerManager: DockerManager): Router {
  const router = Router();

  // Get chat history for a bot
  router.get('/:botId', async (req: Request, res: Response) => {
    try {
      const { botId } = req.params;
      const messages = await getBotChatMessages(botId);
      res.json({ messages });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send a message/command to the bot
  router.post('/:botId/send', async (req: Request, res: Response) => {
    try {
      const { botId } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      console.log(`\n=== Chat: Sending message to bot ${botId} ===`);
      console.log('Message:', message);

      // Save user message
      const userMessageId = uuidv4();
      const userMessage = {
        id: userMessageId,
        botId,
        sender: 'user' as const,
        message,
        timestamp: Date.now(),
      };
      await saveChatMessage(userMessage);

      // Call LLM API
      try {
        // Get chat history for context
        const chatHistory = await getBotChatMessages(botId);

        // Build messages array for LLM (limit to last 20 messages for context)
        const recentMessages = chatHistory.slice(-20);
        const llmMessages = recentMessages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.message
        }));

        // Add current user message
        llmMessages.push({
          role: 'user',
          content: message
        });

        console.log('Calling shared OpenClaw Gateway with', llmMessages.length, 'messages...');

        // Call shared OpenClaw Gateway via WebSocket connection
        // Note: Using Anthropic API directly since HTTP endpoint isn't available
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY || '',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-opus-4-20250514',
            max_tokens: 1024,
            messages: llmMessages
          })
        });

        if (!anthropicResponse.ok) {
          const errorText = await anthropicResponse.text();
          throw new Error(`Anthropic API error: ${anthropicResponse.status} - ${errorText}`);
        }

        const anthropicData = await anthropicResponse.json() as AnthropicResponse;
        const llmResponse = {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: anthropicData.content?.[0]?.text || 'No response'
              }
            }]
          })
        } as any;

        if (!llmResponse.ok) {
          const errorText = await llmResponse.text();
          throw new Error(`LLM API error: ${llmResponse.status} - ${errorText}`);
        }

        const llmData = await llmResponse.json() as LLMResponse;
        console.log('LLM API response:', JSON.stringify(llmData, null, 2));

        // Extract bot response from LLM
        const botResponse = llmData.choices?.[0]?.message?.content || 'No response from LLM';

        // Save bot response
        const botMessageId = uuidv4();
        const botMessage = {
          id: botMessageId,
          botId,
          sender: 'bot' as const,
          message: botResponse,
          timestamp: Date.now(),
        };
        await saveChatMessage(botMessage);

        res.json({
          userMessage,
          botMessage,
        });
      } catch (error: any) {
        console.error('Error calling LLM API:', error);

        // Save error message as bot response
        const botMessageId = uuidv4();
        const botMessage = {
          id: botMessageId,
          botId,
          sender: 'bot' as const,
          message: `Error: ${error.message}`,
          timestamp: Date.now(),
          error: error.message,
        };
        await saveChatMessage(botMessage);

        res.json({
          userMessage,
          botMessage,
        });
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Clear chat history for a bot
  router.delete('/:botId', async (req: Request, res: Response) => {
    try {
      const { botId } = req.params;
      await clearBotChatMessages(botId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
