/**
 * Módulo: AI Agent
 * Sistema de dados e serviços para agent de IA
 */

import { AI_AGENT_DATA } from './ai-agent-data.js';
import { AI_AGENT_SERVICE } from './ai-agent-service.js';

export const AIAgent = {
  data: AI_AGENT_DATA,
  service: AI_AGENT_SERVICE,

  init() {
    console.log('AI Agent inicializado');
    // Inicializar serviços do agent
  }
};

export default AIAgent;
