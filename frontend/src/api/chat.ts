import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export interface ChatResponse {
  response: string;
}

export const sendMessage = async (message: string): Promise<ChatResponse> => {
  const response = await axios.post(`${API_BASE_URL}/chat`, { message });
  return response.data;
}; 